import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import dbConnect from "./lib/mongodb";
import { User as MongoUser } from "./models/User";
import { strapi } from "./lib/api/sdk";

const siteBaseUrl = process.env.SITE_BASE_URL?.trim().replace(/\/+$/, "");
if (siteBaseUrl) {
  process.env.NEXTAUTH_URL = siteBaseUrl;
}

const googleClientId = process.env.OATH_CLIENT_ID || '805588277426-tskm8e99073uqt4et3amltkift6pm688.apps.googleusercontent.com';
const googleClientSecret = process.env.OATH_CLIENT_SECRET || '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';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Password Login",
      credentials: {
        identifier: { label: "Identifier", type: "text" },
        password: { label: "password", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) return null;

          const { user, jwt } = (await strapi.login({
            identifier: credentials?.identifier,
            password: credentials?.password,
          })) as any;
          if (jwt && user) {
            return {
              id: String(user.id),
              identifier: user?.email ? user.email : "User without identifier",
              jwt: jwt,
            };
          }

          return null;
        } catch (err: any) {
          console.error("Password login failed", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const googleProfile = profile as
        | { email_verified?: boolean; name?: string }
        | undefined;
      const email = user.email?.trim().toLowerCase();
      if (!email || googleProfile?.email_verified !== true) return false;

      await dbConnect();
      let dbUser = await MongoUser.findOne({ email });
      if (!dbUser) {
        dbUser = await MongoUser.create({
          email,
          username: googleProfile.name || user.name || email.split("@")[0],
          provider: "google",
        });
      } else if (!dbUser.username && (googleProfile.name || user.name)) {
        dbUser.username = googleProfile.name || user.name || undefined;
        await dbUser.save();
      }

      user.id = dbUser._id.toString();
      user.identifier = email;
      user.jwt = jwt.sign(
        { id: dbUser._id.toString(), email },
        process.env.NEXTAUTH_SECRET || "secret",
        { expiresIn: "7d" }
      );
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.jwt = user.jwt;
        token.identifier = user.identifier;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.sub as string,
        identifier: token.identifier as string,
      };
      session.jwt = token.jwt as string;
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET || 'secret',
};
