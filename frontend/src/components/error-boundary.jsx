import { Component } from "react";
import { Button } from "@/components/ui/button";

/** Shows the error instead of a blank page when a render crashes. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ui crash]", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="surface-card max-w-lg space-y-3 p-6">
          <p className="font-montserrat text-lg font-semibold">Something went wrong on this page</p>
          <pre className="overflow-auto rounded-md bg-secondary/60 p-3 text-xs whitespace-pre-wrap text-danger">
            {String(error?.message || error)}
          </pre>
          <div className="flex gap-2">
            <Button variant="solid" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button variant="ghost" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
