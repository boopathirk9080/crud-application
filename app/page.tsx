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

// MUI Components for Alerts and Dialogs
import {
  Alert,
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from "@mui/material";


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

// Interface for Employee data
interface Employee {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  phone: string;
  mail: string;
}

// Interface for Snackbar state
interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

// Interface for Dialog state
interface DialogState {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
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
  const [selectAllData, setSelectAllData] = React.useState(false);
  
  // --- NEW: Global filter state for universal search ---
  const [globalFilter, setGlobalFilter] = React.useState('');


  // --- MUI Component State ---
  const [snackbar, setSnackbar] = React.useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [dialog, setDialog] = React.useState<DialogState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });


  // Fetch employees data from Supabase
  const fetchEmployees = async () => {
    const { data: employees, error } = await supabase
      .from("Employee")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching employees:", error.message);
       setSnackbar({ open: true, message: `Error fetching data: ${error.message}`, severity: 'error' });
    } else {
      setData(employees ?? []);
    }
  };

  // Fetch data on component mount
  React.useEffect(() => {
    fetchEmployees();
  }, []);

  // --- Snackbar and Dialog Handlers ---
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleCloseDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));
  };


  // --- REFACTORED DELETE LOGIC ---

  // This function is now called when the user confirms the dialog
  const confirmDelete = async (employeeIdsToDelete: string[]) => {
      if (employeeIdsToDelete.length === 0) return;

      const { error } = await supabase
        .from("Employee")
        .delete()
        .in("id", employeeIdsToDelete);

      if (error) {
        setSnackbar({ open: true, message: `Error deleting: ${error.message}`, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: "Record(s) deleted successfully!", severity: 'success' });
        fetchEmployees(); // Refresh data
        table.resetRowSelection();
        setSelectAllData(false);
      }
      handleCloseDialog();
  };


  // 1. Handler for bulk deletion (opens confirmation dialog)
  const handleDeleteSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    let employeeIdsToDelete: string[] = [];
    let confirmationMessage = "";

    if (selectAllData) {
      confirmationMessage = "Are you sure you want to delete ALL employees from the database?";
      employeeIdsToDelete = data.map((emp) => emp.id);
    } else {
      confirmationMessage = `Are you sure you want to delete the ${selectedRows.length} selected employee(s)?`;
      employeeIdsToDelete = selectedRows.map((row) => row.original.id);
    }

    if (employeeIdsToDelete.length === 0) {
        setSnackbar({ open: true, message: "Please select records to delete.", severity: 'info' });
        return;
    }

    setDialog({
        open: true,
        title: "Confirm Deletion",
        description: confirmationMessage,
        onConfirm: () => confirmDelete(employeeIdsToDelete),
    });
  };

  // 2. Handle single employee deletion (opens confirmation dialog)
  const handleDelete = (employeeId: string) => {
     setDialog({
        open: true,
        title: "Confirm Deletion",
        description: "Are you sure you want to delete this employee?",
        onConfirm: () => confirmDelete([employeeId]),
    });
  };


  // Handle "Select All Data" checkbox
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAllData(checked);
    table.toggleAllPageRowsSelected(checked);
  };

  // Define table columns
  const columns: ColumnDef<Employee>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            selectAllData ||
            (table.getIsAllPageRowsSelected() && !table.getIsSomePageRowsSelected())
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
                className="text-red-600 focus:text-red-500 focus:bg-red-50"
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
      globalFilter, // Add global filter state to table
    },
    onGlobalFilterChange: setGlobalFilter, // Handle changes to the global filter
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // This enables global filtering
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="w-full p-4 md:p-8">
      {/* --- Toolbar --- */}
      <div className="flex items-center py-4 gap-4 flex-wrap">
        {/* --- UPDATED: Global search input --- */}
        <Input
          placeholder="Filter by name, email, phone..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
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

      {/* --- Data Table --- */}
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

      {/* --- MUI NOTIFICATION AND DIALOG COMPONENTS --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={dialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{dialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialog.description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCloseDialog}>Cancel</MuiButton>
          <MuiButton onClick={dialog.onConfirm} color="error" autoFocus>
            Confirm
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
