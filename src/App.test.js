import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("calculator renders and performs basic addition", () => {
  render(<App />);

  userEvent.click(screen.getByText("7"));
  userEvent.click(screen.getByText("+"));
  userEvent.click(screen.getByText("2"));
  userEvent.click(screen.getByText("="));

  expect(screen.getByTestId("display")).toHaveTextContent("9");
});

test("calculator history records results", () => {
  render(<App />);

  userEvent.click(screen.getByText("1"));
  userEvent.click(screen.getByText("+"));
  userEvent.click(screen.getByText("1"));
  userEvent.click(screen.getByText("="));

  userEvent.click(screen.getByText(/show history/i));
  const historyList = screen.getByRole("list");
  expect(within(historyList).getByText(/1\+1/)).toBeInTheDocument();
  expect(within(historyList).getByText(/2/)).toBeInTheDocument();
});
