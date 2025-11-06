'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthenticatedPage({ children }) {
    const router = useRouter();

    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth/login');
        }
    });

    return (
        <>
            {
                status == 'authenticated' &&
                children
            }
        </>
    );
}
