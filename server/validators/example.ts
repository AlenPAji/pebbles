import "server-only";

export type ExampleResponse = {
  message: string;
};

export function validateExampleResponse(value: ExampleResponse): ExampleResponse {
  if (!value.message.trim()) {
    throw new Error("Example response message cannot be empty");
  }

  return value;
}
