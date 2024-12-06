// server.js (backend)

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import connectDB from './db.js';

const app = express();

// CORS Configuration
app.use(cors({
  origin: ['https://awy-hr-management-system.netlify.app', 'http://localhost:5173'], // Add both production and local URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

connectDB(); // Connecting to MongoDB

// Employee Schema
const employeeSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

// Vehicle Schema
const vehicleSchema = new mongoose.Schema(
  {
    vin: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    mileage: { type: Number, required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    status: {
      type: String,
      enum: ['available', 'in use', 'sold', 'on service'],
      default: 'available',
    },
  },
  { timestamps: true }
);

// Model Definitions
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

// API Routes for Employees
app.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

app.post('/employees', async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Staff number must be unique' });
    }
    res.status(500).json({ message: 'Failed to save employee', error: error.message });
  }
});

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
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

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
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

// API Routes for Vehicles
app.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('driver', 'fullName');
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
});

app.post('/vehicles', async (req, res) => {
  try {
    const newVehicle = new Vehicle(req.body);
    const savedVehicle = await newVehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'VIN must be unique' });
    }
    res.status(500).json({ message: 'Failed to save vehicle', error: error.message });
  }
});

// Handle Unknown Routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
