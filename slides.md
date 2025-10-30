--- { "layout" : "center" }

# React query basics and beyond 🚀

By Bartosz Bujakowski

---

### PART 1

## What is react query?

**Powerful asynchronous state management, server-state utilities and data fetching**

_\* also works for angular, vue, svelte..._

---

## React Query - Handles common network use cases out of the box

- Loading states
- Error states
- Fetching states
- Fetching based on condition
- Data synchronization in multiple components
- Chain fetching
- Pagination / Infinite scrolling
- Caching
- Background updates
- and more...

---

![React to redux](redux-to-react-query.png)

---

```jsx
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  );
}

function Example() {
  const { isPending, error, data } = useQuery({
    queryKey: ["repoData"],
    queryFn: () =>
      fetch("https://api.github.com/repos/TanStack/query").then((res) =>
        res.json()
      ),
  });

  if (isPending) return "Loading...";
  if (error) return "An error has occurred: " + error.message;

  return <h1>{data.name}</h1>;
}
```

---

## useQuery overview

- queryKey - A unique key for the query - determines when a query should refetch

```jsx
useQuery({ queryKey: ['todo', 5], ... })
```

- queryFn - A function that returns a promise that resolves the data, or Throws an error

```jsx
useQuery({ queryKey: ["todo"], queryFn: fetchTodoList });
```

- Other options

```jsx
useQuery({
    queryKey: ["todo"],
    queryFn: fetchTodoList,
    enabled: otherQueryFinished,
    select: (data) => data.name,
    refetchInterval: ...
});
```

---

## useQuery overview

- useQuery returns a set of helpful state and callback values for managing asynchronous data fetching:

```jsx
const { isPending, isError, data, error } = useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodoList,
});
```

https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

---

```jsx
function App() {
  const mutation = useMutation({
    mutationFn: (newTodo) => {
      return axios.post("/todos", newTodo);
    },
  });
  return (
    <div>
      {mutation.isPending ? (
        "Adding todo..."
      ) : (
        <>
          {mutation.isError ? (
            <div>An error occurred: {mutation.error.message}</div>
          ) : null}
          {mutation.isSuccess ? <div>Todo added!</div> : null}
          <button
            onClick={() => {
              mutation.mutate({ id: new Date(), title: "Do Laundry" });
            }}
          >
            Create Todo
          </button>
        </>
      )}
    </div>
  );
}
```

---

### PART 2

## Use query tips & tricks

Based on mostly of tkdodos's blog and my own personal experience

https://tanstack.com/query/v5/docs/framework/react/community/tkdodos-blog

---

## 1. Create custom hooks

In component:

```jsx
const { data: todos = [] } = useGetTodos();
```

Hook:

```jsx
import { apiClient } from "services";

export const useGetTodos = () => {
  return useQuery({
    queryKey: ["todo"],
    queryFn: async () => {
      return await apiClient.getTodos();
    },
  });
};
```

---

## 2. Manage your query keys

```jsx
export const useGetTodos = () => {
  return useQuery({
    queryKey: [useGetTodos.queryKey], // 👀 Look here
    queryFn: async () => {
      return await apiClient.getTodos();
    },
  });
};

useGetTodos.queryKey = "useGetTodos"; // 👀 Look here
```

In another query / component...

```jsx
queryClient.invalidateQueries({
  queryKey: [useGetTodos.queryKey],
});
```

https://tkdodo.eu/blog/effective-react-query-keys

---

## 3. Type safety

```ts
export const useGetCompetencesTree = <T = CompetenceAreaWeb[]>(
  options?: Partial<UseQueryOptions<CompetenceAreaWeb[], unknown, T>>
) => {
  return useQuery({
    queryKey: [useGetCompetencesTree.queryKey],
    queryFn: async () => {
      return (await apiClient.api.domainModelCompetences
        .getCompetencesTree()
        .json()) as CompetenceAreaWeb[];
    },
    ...options,
  });
};

useGetCompetencesTree.queryKey = "useGetCompetencesTree";
```

_Note to self: For example search for select in cockpit_

---

## 4. Meta for global error handling

```jsx
export const useGetTodos = () => {
  return useQuery({
    queryKey: [useGetTodos.queryKey],
    queryFn: async () => {
      return await apiClient.getTodos();
    },
    meta: {
      devErrorMsg: useGetTodos.queryKey, // 👀 Look here
    },
  });
};

useGetTodos.queryKey = "useGetTodos";
```

---

&nbsp;
&nbsp;
&nbsp;
&nbsp;

```jsx
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(query.meta?.devErrorMsg);
      handleGenericError(error, query.meta?.devErrorMsg);
    },
  }),
});
```

---

## 5. Proper way to refetch data

Change the queryKey

```jsx
function Component() {
  const [filters, setFilters] = React.useState();
  const { data } = useQuery({
    queryKey: ["todos", filters],
    queryFn: () => fetchTodos(filters),
  });

  // ✅ set local state and let it drive the query
  return <Filters onApply={setFilters} />;
}
```

---

```jsx
// ⚠️ Probably not what you need
const { mutate: updateProfile } = useUpdateProfile({
  onSuccess: () => {
    refetchGetTodos();
  },
});
```

- Needs a reference to getTodos
- Overall not recommended

```jsx
// ✅ Let react query do it's magic
const { mutate: updateProfile } = useUpdateProfile({
  onSuccess: () => {
    invalidateQueries({
      queryKey: [useGetTodos.queryKey],
    });
  },
});
```

- React query will automatically refetch data where needed

---

## 6. Use default state

Avoid undefined / null by initializing data with empty types `todos = []`.
Allows you to get rid of all the null/undefined checks.

```jsx
const { data: todos = [] } = useGetTodos();

return (
    <div>
        {todos.map(item) => {
            <span key={item.id}>{item.name}</span>
        }}
    </div>
)
```

---

## 7. Use enabled

- To chain queries

```jsx
const { data: settings = {} } = useGetSettings();
const { data: todos = [] } = useGetTodos(settings.itemsOnPage, {
  enabled: Boolean(settings.itemsOnPage),
});
```

- To restrict access

```jsx
const { data: todos = [] } = useGetTodos({
  enabled: isAdmin,
});
```

- To wait for user input

```jsx
const [selectedFilters, setSelectedFilters] = useState([]);
const { data: todos = [] } = useGetTodos({
  enabled: selectedFilters.length > 0,
});
```

---

## 8. Select the data you need

⚠️ Wrong

```jsx
const { data: todos = [] } = useGetTodos();
const todoNames = data.map((item) => item.name);
```

✅ Correct

```jsx
const { data: todos = [] } = useGetTodos({
  select: (data) => data.map((item) => item.name),
});
```

---

## 9. Avoid overusing useState

🙈 Don't look!

```jsx
const [todoNames, setTodoNames] = useState([]);
const { data: todos = [] } = useGetTodos();

useEffect(() => {
  const names = data.map((item) => item.name);
  setTodoNames(names);
}, [todos]);
```

https://react.dev/learn/you-might-not-need-an-effect

---

## 10. Optimistic updates

```jsx
const { isPending, variables, mutate } = addTodoMutation;

return (
  <div>
    <button onClick={() => mutate({ text: "new todo" });}>Add TODO</button>
    <ul>
      {todoQuery.items.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
      {isPending && <li style={{ opacity: 0.5 }}>{variables}</li>}
    </ul>
  </div>
);
```

https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates

---

<div style="
  display: flex;
  justify-content: center;
  align-items: center;
">
  <img src="thats-all-folks.png" alt="That's all folks" />
</div>
