import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      identifier: string;
    };
    jwt: string;
  }

  interface User {
    id: string;
    identifier: string;
    jwt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jwt?: string;
    identifier?: string;
  }
}
