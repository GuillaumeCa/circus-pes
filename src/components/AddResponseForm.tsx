import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getFileExtension,
  MAX_IMAGE_UPLOAD_SIZE,
  MIN_IMAGE_UPLOAD_SIZE,
} from "../utils/storage";
import { trpc } from "../utils/trpc";
import { Button } from "./Button";
import { cls } from "./cls";
import { FormRow } from "./FormRow";
import { XMarkIcon } from "./Icons";

const responseFormSchema = z.object({
  isFound: z.boolean(),
  comment: z.string().min(1).max(255),
  image:
    typeof window === "undefined"
      ? z.null()
      : z
          .instanceof(FileList)
          .refine((f) => {
            return (
              f.length === 0 ||
              (f.length > 0 &&
                ["image/jpg", "image/jpeg", "image/png"].includes(f[0].type))
            );
          }, "Le fichier n'est pas une image au format valide: jpeg, jpg ou png")
          .refine((f) => {
            return (
              f.length === 0 ||
              (f.length > 0 &&
                f[0].size >= MIN_IMAGE_UPLOAD_SIZE &&
                f[0].size <= MAX_IMAGE_UPLOAD_SIZE)
            );
          }, "L'image est trop grosse, elle doit faire moins de 5 Mo"),
});
type ResponseFormData = z.infer<typeof responseFormSchema>;

export function AddResponseForm({
  itemId,

  onClose,
  onSuccess,
}: {
  itemId: string;
  onClose(): void;
  onSuccess(): void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const ctx = trpc.useContext();
  const { mutateAsync: createResponse } = trpc.response.create.useMutation();
  const { mutateAsync: getImageUploadUrl } =
    trpc.response.imageUploadUrl.useMutation();
  const { mutateAsync: setImage } = trpc.response.setImage.useMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    resetField,
    watch,
    formState: { errors },
  } = useForm<ResponseFormData>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      isFound: true,
      image: undefined,
    },
  });

  const isFound = watch("isFound");

  async function onSubmit(form: ResponseFormData) {
    setLoading(true);
    setError(false);
    try {
      const file = form.image?.item(0);
      const createdResponse = await createResponse({
        comment: form.comment,
        isFound: form.isFound,
        itemId,
        withImage: !!file,
      });
      if (createdResponse && file) {
        const ext = getFileExtension(file);
        const postPolicyResult = await getImageUploadUrl({
          id: createdResponse.id,
          ext: ext as "jpeg" | "jpg" | "png",
        });
        const formData = new FormData();
        for (let key in postPolicyResult.formData) {
          formData.append(key, postPolicyResult.formData[key]);
        }
        formData.append("file", file);

        const res = await fetch(postPolicyResult.postURL, {
          method: "POST",
          body: formData,
        });

        const key = postPolicyResult.formData["key"];

        if (!res.ok) {
          throw new Error("failed to upload image");
        }
        await setImage({ id: createdResponse.id, image: key });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to add response", err);
      setError(true);
    }

    setLoading(false);
    ctx.response.getForItem.refetch();
  }

  const image = watch("image");

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

        <FormRow
          id="comment"
          label="Commentaire"
          errorMessage={errors.comment?.message}
        >
          <textarea
            id="comment"
            className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
            maxLength={255}
            rows={3}
            {...register("comment")}
          />
        </FormRow>
        <FormRow
          id="image"
          label="Image (optionnel)"
          errorMessage={errors.image?.message}
        >
          <div className="flex">
            <input
              type="file"
              className="block w-full text-sm border rounded-lg file:text-gray-300 file:bg-gray-800 file:font-bold hover:file:bg-gray-900 file:border-none file:py-2 file:px-3 file:mr-3 file:cursor-pointer text-gray-400 focus:outline-none bg-gray-600 border-gray-500 placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500"
              id="image"
              accept=".jpg,.jpeg,.png"
              {...register("image")}
            />
            {(image?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => resetField("image")}
                className="bg-gray-500 p-2 rounded-lg ml-2"
              >
                <XMarkIcon />
              </button>
            )}
          </div>
        </FormRow>
        <div className="flex justify-end items-center space-x-2">
          {error && (
            <p className="text-red-500">
              Impossible d&apos;ajouter la réponse, veuillez réessayer
            </p>
          )}
          <Button type="button" btnType="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={loading} type="submit">
            {loading ? "Chargement..." : "Valider"}
          </Button>
        </div>
      </form>
    </>
  );
}
