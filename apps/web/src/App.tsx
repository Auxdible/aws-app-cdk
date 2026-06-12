import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";
import { useQuery } from "react-query";

function App() {
  const [count, setCount] = useState(0);
  const {
    data: todos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const data = await fetch(import.meta.env.VITE_API_URL + "/todos");
      const json = await data.json();
      return json;
    },
  });
  return <></>;
}

export default App;
