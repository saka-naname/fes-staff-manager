type Status = Exited | Entered;

type Exited = {
  type: "Exited"
  id: 0,
}

type Entered = {
  type: "Entered",
  id: 1,
}

const getStatusType = (statusStr: string = ""): Status | undefined => {
  switch (statusStr) {
    case "Exited": return { id: 0, type: "Exited" };
    case "Entered": return { id: 1, type: "Entered" };
    default: return undefined;
  }
}

export { getStatusType };
export type { Status };
