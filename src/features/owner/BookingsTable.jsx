import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function BookingsTable({ bookings }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Station</TableHead>
          <TableHead>Energy Used</TableHead>
          <TableHead className="text-right">Cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.bookingId}>
            <TableCell>{booking.user}</TableCell>
            <TableCell>{booking.station}</TableCell>
            <TableCell>{booking.energyUsed} kWh</TableCell>
            <TableCell className="text-right font-medium">₹{booking.cost}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
