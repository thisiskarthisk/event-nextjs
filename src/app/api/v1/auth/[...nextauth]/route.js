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

          if (!(user && user.length > 0 && user[0])) throw new Error('The account dose not exists!');

          user = user[0];

          // console.log('NextAuth -> authorize() -> user:', password, user.password);

          const isValid = await bcrypt.compare(password, user.password);

          if (!isValid) throw new Error('Invalid credentials!');

          let formattedUser = {};

          for (const i in Tables.PublicFields[Tables.TBL_USERS]) {
            const col = Tables.PublicFields[Tables.TBL_USERS][i];

            formattedUser[col] = user[col];
          }

          // console.log('user:', formattedUser);

          return {
            ...formattedUser
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
    session: async ({ session, token, user }) => {
      console.log('NextAuth->callbacks->session()');

      return session;
    },
  },
});

export {
  handler as GET,
  handler as POST
};
