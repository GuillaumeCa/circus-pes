import { ItemList } from "../../components/Items";
import AccountLayout from "../../components/layouts/AccountLayout";
import { trpc } from "../../utils/trpc";

export default function Account() {
  const {
    data: items,
    isError,
    isLoading,
    refetch,
  } = trpc.item.byUser.useQuery();

  return (
    <AccountLayout>
      <ItemList
        isLoading={isLoading}
        items={items}
        hasItems={items?.length !== 0}
        hasError={isError}
        onLike={() => refetch()}
        onUpdateItems={() => refetch()}
      />
    </AccountLayout>
  );
}
