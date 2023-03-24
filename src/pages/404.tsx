import { BaseLayout } from "../components/layouts/BaseLayout";
import { LinkButton } from "../components/ui/Button";

export default function NotFound() {
  return (
    <BaseLayout>
      <div className="text-center">
        <h2 className="text-4xl font-bold m-8">
          Cette page n&apos;existe pas !
        </h2>

        <div className="flex justify-center mt-4">
          <LinkButton href="/" btnType="primary">
            Accueil
          </LinkButton>
        </div>
      </div>
    </BaseLayout>
  );
}
