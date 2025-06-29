import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes/index";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
const queryClient = new QueryClient();

const App: React.FC = () => {
    return (
        <JotaiProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </JotaiProvider>
    );
};

export default App;
