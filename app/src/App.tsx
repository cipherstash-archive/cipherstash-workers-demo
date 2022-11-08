import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import Home from "./Home";
import Admin from "./Admin";

const DEFAULT_QUERY_CLIENT = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={DEFAULT_QUERY_CLIENT}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
