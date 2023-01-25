import { BaseLayout } from "../components/layouts/BaseLayout";

export default function AuthError() {
  return (
    <BaseLayout>
      <div className="text-center">
        <h2 className="text-4xl font-bold m-8">
          Oops, quelque chose s&apos;est mal passé lors de votre connexion #30K
        </h2>
        <p className="text-gray-400 text-lg">
          Veuillez réessayer de vous connecter ultérieurement
        </p>
      </div>
    </BaseLayout>
  );
}
