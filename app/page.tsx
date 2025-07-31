"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

// --- NEW IMPORTS for AlertDialog and Toast ---
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Employee {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  phone: string;
  mail: string;
}

export default function DataTableDemo() {
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast
  const [data, setData] = React.useState<Employee[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectAllData, setSelectAllData] = React.useState(false);

  // --- NEW STATE for managing the confirmation dialog ---
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = React.useState("");

  // Fetch employees data from Supabase
  const fetchEmployees = async () => {
    const { data: employees, error } = await supabase
      .from("Employee")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching employees:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch employee data.",
      });
    } else {
      setData(employees ?? []);
    }
  };

  // Fetch data on component mount
  React.useEffect(() => {
    fetchEmployees();
  }, []);

  // --- REVISED HANDLER for bulk deletion ---
  const handleDeleteSelected = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    let employeeIdsToDelete: string[] = [];
    let confirmationMessage = "";

    if (selectAllData) {
      confirmationMessage = "Are you sure you want to delete ALL employees?";
      employeeIdsToDelete = data.map((emp) => emp.id);
    } else {
      confirmationMessage = `Are you sure you want to delete ${selectedRows.length} selected employee(s)?`;
      employeeIdsToDelete = selectedRows.map((row) => row.original.id);
    }

    if (employeeIdsToDelete.length === 0) {
      toast({
        title: "No selection",
        description: "Please select records to delete.",
      });
      return;
    }

    // Set confirmation details and open dialog
    setConfirmMessage(confirmationMessage);
    setConfirmAction(() => async () => {
      const { error } = await supabase
        .from("Employee")
        .delete()
        .in("id", employeeIdsToDelete);

      if (error) {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Success",
          description: "Selected employees deleted successfully!",
        });
        fetchEmployees();
        table.resetRowSelection();
        setSelectAllData(false);
      }
    });
    setIsConfirmOpen(true);
  };

  // --- REVISED HANDLER for single employee deletion ---
  const handleDelete = async (employeeId: string) => {
    // Set confirmation details and open dialog
    setConfirmMessage("Are you sure you want to delete this employee?");
    setConfirmAction(() => async () => {
      const { error } = await supabase
        .from("Employee")
        .delete()
        .eq("id", employeeId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Success",
          description: "Employee deleted successfully!",
        });
        fetchEmployees();
      }
    });
    setIsConfirmOpen(true);
  };

  const handleSelectAllChange = (checked: boolean) => {
    setSelectAllData(checked);
    table.toggleAllPageRowsSelected(checked);
  };

  const columns: ColumnDef<Employee>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          id="selectAllData"
          checked={
            selectAllData ||
            (table.getIsAllPageRowsSelected() &&
              !table.getIsSomePageRowsSelected())
          }
          onCheckedChange={(value) => handleSelectAllChange(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    { accessorKey: "age", header: "Age" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "occupation", header: "Occupation" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "mail",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/employee/form/${employee.id}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(employee.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="w-full p-4 md:p-8">
      {/* --- NEW: Toaster for displaying notifications --- */}
      <Toaster />

      {/* --- NEW: AlertDialog for confirmations --- */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  confirmAction();
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center py-4 gap-4 flex-wrap">
        <Input
          placeholder="Filter by email..."
          value={(table.getColumn("mail")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("mail")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        {table.getSelectedRowModel().rows.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            className="ml-2"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {selectAllData
              ? "Delete All"
              : `Delete Selected (${table.getSelectedRowModel().rows.length})`}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => router.push("/employee/form")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
