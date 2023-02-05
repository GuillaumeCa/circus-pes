import { Dialog, Transition } from "@headlessui/react";
import { Fragment, MutableRefObject, useRef } from "react";
import { inter } from "../pages/_app";
import { Button } from "./Button";
import { cls } from "./cls";

interface ModalProps {
  className?: string;
  open: boolean;
  children?: React.ReactNode;
  initFocus?: MutableRefObject<any>;
  onClose(): void;
}

export function Modal({
  open,
  children,
  className = "",
  onClose,
  initFocus,
}: ModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        initialFocus={initFocus}
        className={inter.variable + " font-sans relative z-10"}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black h-full bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={
                  "w-full transform overflow-hidden text-gray-300 bg-gray-700 rounded-lg shadow-xl transition-all " +
                  className
                }
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface ConfirmModalProps extends ModalProps {
  title: string;
  description?: string;
  acceptLabel?: string;
  cancelLabel?: string;
  onAccept(): void;
}

export function ConfirmModal(props: ConfirmModalProps) {
  const ref = useRef();

  return (
    <Modal
      onClose={props.onClose}
      open={props.open}
      initFocus={ref}
      className={cls("max-w-md", props.className ?? "")}
    >
      <div className="p-5 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-center">{props.title}</h2>
        {props.description && (
          <p className="mt-2 text-md text-gray-400 text-center">
            {props.description}
          </p>
        )}
        <div className="flex mt-8 space-x-2">
          <Button autoFocus={false} onClick={props.onAccept}>
            {props.acceptLabel ?? "Ok"}
          </Button>
          <Button ref={ref} btnType="secondary" onClick={props.onClose}>
            {props.cancelLabel ?? "Annuler"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
