import { useForm } from "react-hook-form";
import { trpc } from "../utils/trpc";
import { Button } from "./Button";
import { cls } from "./cls";
import { FormRow } from "./FormRow";

interface ResponseForm {
  isFound: boolean;
  comment: string;
}

export function AddResponseForm({
  itemId,

  onClose,
  onSuccess,
}: {
  itemId: string;
  onClose(): void;
  onSuccess(): void;
}) {
  const ctx = trpc.useContext();
  const { mutateAsync: createResponse } = trpc.response.create.useMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    resetField,
    watch,
    formState: { errors },
  } = useForm<ResponseForm>({
    defaultValues: {
      isFound: true,
    },
    // resolver: zodResolver(itemFormSchema),
  });

  const isFound = watch("isFound");

  async function onSubmit(form: ResponseForm) {
    console.log(form);
    await createResponse({
      comment: form.comment,
      isFound: form.isFound,
      itemId,
    });
    onSuccess();
    onClose();
    ctx.response.getForItem.invalidate(itemId);
  }

  return (
    <>
      <h2 className="text-2xl font-bold">Réponse</h2>
      <p className="text-sm text-gray-400">
        Décrivez si vous avez trouvé cette création et illustrez-la
        optionnellement avec une image.
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-3 mt-2"
      >
        <FormRow id="isFoundLabel" label="Trouvé">
          <div className="flex font-semibold">
            <button
              type="button"
              onClick={() => setValue("isFound", true)}
              className={cls(
                "flex-1 p-2  rounded-l-lg border-r-2 border-gray-600",
                isFound ? "bg-rose-700" : "bg-gray-500"
              )}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setValue("isFound", false)}
              className={cls(
                "flex-1 p-2 bg-gray-500 rounded-r-lg",
                !isFound ? "bg-rose-700" : "bg-gray-500"
              )}
            >
              Non
            </button>
          </div>
        </FormRow>

        <FormRow id="comment" label="Commentaire">
          <textarea
            id="comment"
            className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
            maxLength={255}
            rows={3}
            {...register("comment")}
          />
        </FormRow>
        <FormRow id="image" label="Image (optionnel)">
          <input
            type="file"
            className="block w-full text-sm border rounded-lg file:text-gray-300 file:bg-gray-800 file:font-bold hover:file:bg-gray-900 file:border-none file:py-2 file:px-3 file:mr-3 file:cursor-pointer text-gray-400 focus:outline-none bg-gray-600 border-gray-500 placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500"
            accept=".jpg,.jpeg,.png"
          />
        </FormRow>
        <div className="flex justify-end space-x-2">
          <Button type="button" btnType="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Valider</Button>
        </div>
      </form>
    </>
  );
}
