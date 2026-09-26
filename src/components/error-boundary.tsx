import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/board");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {this.props.fallbackTitle ?? "Something went wrong in this view"}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {this.state.error?.message ||
              this.props.fallbackDescription ||
              "An unexpected error occurred while rendering this section. You can try refreshing the view or return to the main board."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={this.handleGoHome}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Board
            </Button>
          </div>

          {process.env.NODE_ENV !== "production" && this.state.error && (
            <details className="mt-8 max-w-2xl rounded-lg border border-border bg-muted/40 p-3 text-left font-mono text-xs text-muted-foreground">
              <summary className="cursor-pointer font-sans font-medium text-foreground">
                Error technical details
              </summary>
              <div className="mt-2 overflow-x-auto whitespace-pre p-2 bg-background/80 rounded border border-border">
                {this.state.error.stack || this.state.error.toString()}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
