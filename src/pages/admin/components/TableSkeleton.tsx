import { TableBody, TableRow, TableCell, Skeleton } from "@mui/material";

/**
 * A reusable loading skeleton for MUI Tables.
 * Renders 5 placeholder rows with the given number of columns.
 */
export default function TableSkeleton({ cols }: { cols: number }) {
  return (
    <TableBody>
      {[1, 2, 3, 4, 5].map((row) => (
        <TableRow key={row}>
          {[...Array(cols)].map((_, col) => (
            <TableCell key={col}>
              <Skeleton
                variant="text"
                sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
