
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
  const [data, setData] = React.useState<Employee[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // --- NEW STATE ---
  // State to track if the user wants to select all data, not just on the current page.
  const [selectAllData, setSelectAllData] = React.useState(false);

  // Fetch employees data from Supabase
  const fetchEmployees = async () => {
    const { data: employees, error } = await supabase
      .from("Employee")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching employees:", error.message);
    } else {
      setData(employees ?? []);
    }
  };

  // Fetch data on component mount
  React.useEffect(() => {
    fetchEmployees();
  }, []);

  // --- NEW HANDLER for bulk deletion ---
  const handleDeleteSelected = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    let employeeIdsToDelete: string[] = [];
    let confirmationMessage = "";

    if (selectAllData) {
      // If "Select All Data" is checked, we target all employees
      confirmationMessage = "Are you sure you want to delete ALL employees?";
      employeeIdsToDelete = data.map((emp) => emp.id);
    } else {
      // Otherwise, we only target the specifically selected rows
      confirmationMessage = `Are you sure you want to delete ${selectedRows.length} selected employee(s)?`;
      employeeIdsToDelete = selectedRows.map((row) => row.original.id);
    }

    if (employeeIdsToDelete.length === 0) {
      alert("Please select records to delete.");
      return;
    }

    if (window.confirm(confirmationMessage)) {
      // Use the .in() filter to delete multiple rows at once
      const { error } = await supabase
        .from("Employee")
        .delete()
        .in("id", employeeIdsToDelete);

      if (error) {
        alert("Error deleting employees: " + error.message);
      } else {
        alert("Selected employees deleted successfully!");
        fetchEmployees(); // Refresh data
        // Reset selection states
        table.resetRowSelection();
        setSelectAllData(false);
      }
    }
  };

  // Handle single employee deletion (from dropdown menu)
  const handleDelete = async (employeeId: string) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      const { error } = await supabase
        .from("Employee")
        .delete()
        .eq("id", employeeId);

      if (error) {
        alert("Error deleting employee: " + error.message);
      } else {
        alert("Employee deleted successfully!");
        fetchEmployees(); // Refresh the data
      }
    }
  };

  // --- NEW HANDLER for "Select All Data" checkbox ---
  // This syncs our custom `selectAllData` state with the table's selection
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAllData(checked);
    table.toggleAllRowsSelected(checked);
  };

  // Define table columns
  const columns: ColumnDef<Employee>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          id="selectAllData"
          checked={selectAllData}
          onCheckedChange={(checked) => handleSelectAllChange(!!checked)}
          
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
    // ... other columns remain the same
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
                className="text-red-600"
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
      {/* --- UPDATED JSX for toolbar --- */}
      <div className="flex items-center py-4 gap-4 flex-wrap">
        <Input
          placeholder="Filter by email..."
          value={(table.getColumn("mail")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("mail")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        {/* Conditionally render the delete button if any row is selected */}
        {table.getSelectedRowModel().rows.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            className="ml-2"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {/* Dynamically change button text */}
            {selectAllData
              ? "Delete All"
              : `Delete Selected (${table.getSelectedRowModel().rows.length})`}
          </Button>
        )}
        {/* --- END OF NEW ELEMENTS --- */}

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
  );
}
