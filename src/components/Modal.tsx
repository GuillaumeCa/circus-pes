import { Button } from "./Button";
import { cls } from "./cls";

interface ModalProps {
  className?: string;
  open: boolean;
  children?: React.ReactNode;
}

export function Modal({ open, children, className = "" }: ModalProps) {
  return (
    <div
      aria-hidden="true"
      className={cls(
        "fixed inset-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto h-full bg-black/70",
        open ? "flex" : "hidden"
      )}
    >
      <div className={"relative w-full h-full md:h-auto m-auto " + className}>
        <div className="relative bg-gray-700 rounded-lg shadow">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps extends ModalProps {
  title: string;
  description?: string;
  acceptLabel?: string;
  cancelLabel?: string;
  onAccept(): void;
  onCancel(): void;
}

export function ConfirmModal(props: ConfirmModalProps) {
  return (
    <Modal open={props.open} className={cls("max-w-md", props.className ?? "")}>
      <div className="p-5 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-center">{props.title}</h2>
        {props.description && (
          <p className="mt-2 text-md text-gray-400 text-center">
            {props.description}
          </p>
        )}
        <div className="flex mt-8 space-x-2">
          <Button onClick={props.onAccept}>{props.acceptLabel ?? "Ok"}</Button>
          <Button btnType="secondary" onClick={props.onCancel}>
            {props.cancelLabel ?? "Annuler"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
