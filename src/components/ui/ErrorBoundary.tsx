import React from "react";
import { BaseLayout } from "../layouts/BaseLayout";
import { Button } from "./Button";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.error("Something went wrong", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <BaseLayout>
          <div className="text-center">
            <h2 className="text-4xl font-bold m-8">Oops, 30K</h2>

            <Button onClick={() => this.setState({ hasError: false })}>
              Réessayer
            </Button>
          </div>
        </BaseLayout>
      );
    }

    return this.props.children;
  }
}
