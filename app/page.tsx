"use client";
import { useSession } from "next-auth/react";

import TodosPage from "./components/todo/page";
import LandingPage from "./components/landing/page";

export default function Home() {
  return <RealHome />;
}

function RealHome() {
  const session = useSession();
  console.log(session.status);

  return (
    <div>
      {session.status === "authenticated" ? (
        <TodosPage/>
      ) : (
        <LandingPage/>
      )}
    </div>
  );
}