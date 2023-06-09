import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider, { DiscordProfile } from "next-auth/providers/discord";
import { prisma } from "../../../server/db/client";
import { UserRole } from "../../../utils/user";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_ID || "",
      clientSecret: process.env.DISCORD_SECRET || "",
      profile: (profile: DiscordProfile) => {
        if (profile.avatar === null) {
          const defaultAvatarNumber =
            profile.discriminator === "0"
              ? Number(BigInt(profile.id) >> BigInt(22)) % 5
              : parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }

        const name = (profile.global_name as string) ?? profile.username;

        console.log(profile);

        return {
          id: profile.id,
          name,
          email: profile.email,
          image: profile.image_url,
          discriminator:
            profile.discriminator === "0"
              ? profile.username
              : profile.discriminator,
          emailVerified: null,
          role: UserRole.CONTRIBUTOR,
        };
      },
    }),
  ],

  pages: {
    signIn: "/",
    error: "/auth-error",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (user.email && account?.provider === "discord") {
        const p = profile as DiscordProfile;
        const u = await prisma.user.findFirst({
          where: { email: user.email },
          select: { id: true },
        });
        if (u) {
          const name = (p.global_name as string) ?? p.username;
          await prisma.user.update({
            where: { email: user.email },
            data: {
              image: p.image_url,
              name,
              discriminator:
                p.discriminator === "0" ? p.username : p.discriminator,
            },
          });
        }
      }

      return true;
    },

    async session({ session, user }) {
      session.user.role = user.role ?? UserRole.INVITED; // Add role value to user object so it is passed along with session
      session.user.discriminator = user.discriminator ?? "";
      session.user.id = user.id;
      return session;
    },
  },
};

export default NextAuth(authOptions);
