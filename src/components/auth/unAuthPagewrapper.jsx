'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UnAuthenticatedPage({ children, ignoreIfAuthenticated = true }) {
    const router = useRouter();

    const { data: session, status } = useSession();

    useEffect(() => {
        if (ignoreIfAuthenticated && status == 'authenticated') {
            router.push('/');
        }
    }, [status]);

    return (
        <>
            {
                status == 'unauthenticated' &&
                children
            }
        </>
    );
}
