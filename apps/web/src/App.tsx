import { useState } from "react";
import "./App.css";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { CircleSlash, Plus, Trash } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import z from "zod";
import { Controller, Form, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./components/ui/field";
import { Input } from "./components/ui/input";

interface TodosInterface {
  readonly title: string;
  readonly description: string;
  readonly id: string;
}
const zTodosForm = z.object({
  title: z.string({ error: "You need to specify a valid title!" }),
  description: z.string({ error: "You need to specify a valid description!" }),
});

type TodosForm = z.infer<typeof zTodosForm>;
function App() {
  const { data: todos } = useQuery<unknown, Error, TodosInterface[]>({
    queryKey: ["todos"],
    queryFn: async () => {
      const data = await fetch(import.meta.env.VITE_API_URL + "/todos");
      const json: TodosInterface = await data.json();
      return json;
    },
  });
  const form = useForm({ resolver: zodResolver(zTodosForm) });
  const { control, reset } = form;
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: postTodo } = useMutation({
    mutationKey: ["todos", "post"],
    mutationFn: async (data: TodosForm) => {
      const { data: res } = await axios.post<{ id: string }>(
        import.meta.env.VITE_API_URL + "/todos",
        {
          body: new URLSearchParams(data),
        },
      );
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      reset();
      setAddDialogOpen(false);
      toast.success("Success", {
        description: "Successfully created a new todo with ID: " + res.id,
      });
      return res;
    },
    onError: (x) => {
      toast.error("Error", { description: "Failed to upload that Todo!" });
      console.error(x);
    },
  });
  const { mutateAsync: deleteTodo } = useMutation({
    mutationKey: ["todos", "delete"],
    mutationFn: async (id: string) => {
      await axios.delete(import.meta.env.VITE_API_URL + `/todos?id=${id}`);
      toast.success("Success", {
        description: "Successfully deleted that todo.",
      });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      return true;
    },
    onError: (x) => {
      toast.error("Error", { description: "Failed to delete that Todo!" });
      console.error(x);
    },
  });
  return (
    <main className="min-h-screen flex justify-center items-center gap-4">
      <Card className="max-w-2xl! w-full">
        <CardHeader>
          <CardTitle>My Todos</CardTitle>
          <CardDescription>
            These are the todos that you have active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul>
            {(
              todos ?? [
                {
                  title: "Test",
                  description: "test",
                  id: "test",
                },
              ]
            ).map((i) => (
              <li className="flex flex-col gap-2 bg-muted p-2 rounded-2xl">
                <h1 className="text-2xl">{i.title}</h1>
                <p className="text-base">{i.description}</p>
                <span className="text-xs text-muted-foreground">{i.id}</span>
                <Button
                  size={"icon"}
                  variant={"destructive"}
                  onClick={() => deleteTodo(i.id)}
                >
                  <Trash />
                </Button>
              </li>
            )) ?? "No todos found."}
          </ul>
        </CardContent>
        <CardFooter>
          <Dialog
            open={addDialogOpen}
            onOpenChange={(op) => setAddDialogOpen(op)}
          >
            <DialogTrigger className="ml-auto">
              <Button className="ml-auto">
                <Plus /> Add Todo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex gap-1.5 items-center">
                  <Plus size={16} /> Add Todo
                </DialogTitle>
              </DialogHeader>
              <Form
                {...form}
                onSubmit={(e) => postTodo(e.data)}
                className="space-y-6"
              >
                <Controller
                  name="title"
                  control={control}
                  render={({ field, fieldState }) => {
                    return (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                        <Input
                          aria-invalid={fieldState.invalid}
                          id={field.name}
                          {...field}
                        />
                        <FieldDescription>
                          The title of this todo.
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    );
                  }}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState }) => {
                    return (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Description
                        </FieldLabel>
                        <Input
                          aria-invalid={fieldState.invalid}
                          id={field.name}
                          {...field}
                        />
                        <FieldDescription>
                          The description of this todo.
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    );
                  }}
                />
                <DialogFooter>
                  <DialogClose>
                    <Button type="button" variant={"outline"}>
                      <CircleSlash />
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button>
                    <Plus /> Add Todo
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </main>
  );
}

export default App;
