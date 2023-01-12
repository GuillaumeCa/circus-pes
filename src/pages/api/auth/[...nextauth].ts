import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "../../../server/db/client";
import { UserRole } from "../../../utils/user";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_ID || "",
      clientSecret: process.env.DISCORD_SECRET || "",
      profile: (profile) => {
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }

        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.image_url,
          discriminator: profile.discriminator,
          emailVerified: null,
          role: UserRole.CONTRIBUTOR,
        };
      },
    }),
  ],

  pages: {
    signIn: "/",
  },

  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role ?? UserRole.INVITED; // Add role value to user object so it is passed along with session
      session.user.discriminator = user.discriminator ?? "";
      session.user.id = user.id;
      return session;
    },
  },
};

export default NextAuth(authOptions);
