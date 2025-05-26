import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("Error capturado por ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            ¡Ups! Algo salió mal.
          </h1>
          <p className="mb-6 text-gray-700">
            Se produjo un error inesperado. Puedes intentar volver a cargar la
            página o volver al inicio.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Recargar
            </button>
            <a
              href="/home"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
