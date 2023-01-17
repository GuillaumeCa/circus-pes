import { Button } from "../../components/Button";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { trpc } from "../../utils/trpc";

export default function AdmTool() {
  const updateImages = trpc.item._tmpConvertImages.useMutation();

  return (
    <AdminLayout title="Tool">
      <Button onClick={() => updateImages.mutate()}>update images</Button>
    </AdminLayout>
  );
}
