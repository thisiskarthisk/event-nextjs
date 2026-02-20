import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import bcrypt from 'bcrypt';
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email', type: 'text',
        },
        password: {
          label: 'Password', type: 'password',
        },
      },
      async authorize(credentials, req) {
        try {
          const { email, password } = credentials;

          let user = await DB_Fetch(sql`SELECT * FROM ${sql.identifier(Tables.TBL_USERS)} WHERE active = TRUE AND email = ${email}`);

          console.log('\n\nNextAuth -> authorize() -> user:', user);

          if (!(user && user.length > 0 && user[0])) throw new Error('The account dose not exists!');

          user = user[0];

          // console.log('\n\nNextAuth -> authorize() -> user:', password, user.password);

          const isValid = await bcrypt.compare(password, user.password);

          if (!isValid) throw new Error('Invalid credentials!');


          // Fetch event_id from user_events table
          const userEvent = await DB_Fetch(sql`
            SELECT fkevent_id
            FROM ${sql.identifier(Tables.TBL_USER_EVENTS)}
            WHERE fkuser_id = ${user.id}
            LIMIT 1
          `); //new Add property

          const event_id = userEvent.length ? userEvent[0].fkevent_id : null; //new Add property


          let formattedUser = {};

          for (const i in Tables.PublicFields[Tables.TBL_USERS]) {
            const col = Tables.PublicFields[Tables.TBL_USERS][i];

            formattedUser[col] = user[col];
          }


          return {
            ...formattedUser,
            event_id // new Add property
          };
        } catch(error) {
          console.error('[NextAuth -> authorize()] Error occurred:', error);

          return null;
        }
      },
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token = {
          ...user,
          ...token,
          event_id: user.event_id // new Add property
        };
      }

      return token;
    },
    session: async ({ session, token, user }) => {
      if (token) {
        session.user = {
          ...token,
          ...session.user,
          event_id: token.event_id // new Add property
        };
      } else if (user) {
        session.user = {
          ...user,
          ...session.user,
          event_id: user.event_id // new Add property
        };
      }

      return session;
    },
  },
});

export {
  handler as GET,
  handler as POST
};