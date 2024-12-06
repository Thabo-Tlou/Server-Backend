import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import connectDB from './db.js'; // Assuming you have a db.js file for MongoDB connection

const app = express();

// CORS configuration - allows requests from both Netlify and localhost for development
app.use(cors({
  origin: ['https://awy-hr-management-system.netlify.app', 'http://localhost:5173'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Middleware to parse JSON requests

// Connect to MongoDB
connectDB();

// Employee Schema
const employeeSchema = new mongoose.Schema({
  staffNumber: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  identityNumber: { type: String, required: true },
  qualifications: { type: String, required: true },
  position: { type: String, required: true },
  salary: { type: Number, required: true },
  contractStatus: { type: String, enum: ['active', 'terminated'], default: 'active' },
  points: { type: Number, default: 0 },
  pointsHistory: [
    {
      points: { type: Number, required: true },
      reason: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  academicTraining: { type: [String], default: [] },
  professionalTraining: { type: [String], default: [] },
}, { timestamps: true });

// Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  mileage: { type: Number, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Reference to Employee
  status: { type: String, enum: ['available', 'in use', 'sold', 'on service'], default: 'available' },
}, { timestamps: true });

// Create or use existing models
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

// Routes

// Get all employees
app.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

// Create a new employee
app.post('/employees', async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Staff number must be unique' });
    }
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Failed to save employee', error: error.message });
  }
});

// Update an existing employee
app.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid employee ID' });
  }
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

// Delete an employee
app.delete('/employees/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid employee ID' });
  }
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

// Add points to an employee
app.patch('/employees/:id/add-points', async (req, res) => {
  const { id } = req.params;
  const { points, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid employee ID' });
  }
  if (typeof points !== 'number' || points <= 0) {
    return res.status(400).json({ message: 'Points must be a positive number' });
  }
  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ message: 'Reason for points is required' });
  }

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.points += points;
    employee.pointsHistory.push({ points, reason, date: new Date() });

    await employee.save();

    res.status(200).json({ message: 'Points added successfully', employee });
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ message: 'Error adding points', error: error.message });
  }
});

// Get all vehicles
app.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('driver', 'fullName');
    res.status(200).json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
});

// Create a new vehicle
app.post('/vehicles', async (req, res) => {
  try {
    const newVehicle = new Vehicle(req.body);
    const savedVehicle = await newVehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'VIN must be unique' });
    }
    console.error('Error creating vehicle:', error);
    res.status(500).json({ message: 'Failed to save vehicle', error: error.message });
  }
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

