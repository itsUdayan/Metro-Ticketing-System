

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 


mongoose.connect('mongodb://localhost:27017/metro_ticketing', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  fingerprintId: { type: Number, required: true, unique: true },
  balance: { type: Number, default: 100 }, // Initial balance
  registeredAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

const tripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fingerprintId: { type: Number, required: true },
  sourceStation: { type: String },
  destinationStation: { type: String },
  fare: { type: Number },
  sourceTimestamp: { type: Date },
  destinationTimestamp: { type: Date },
  status: { type: String, enum: ['STARTED', 'COMPLETED', 'CANCELLED'], default: 'STARTED' }
});

const deviceCommandSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  command: { type: String, required: true },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }
});

const fareSchema = new mongoose.Schema({
  sourceStation: { type: String, required: true },
  destinationStation: { type: String, required: true },
  fare: { type: Number, required: true }
});


const User = mongoose.model('User', userSchema);
const Trip = mongoose.model('Trip', tripSchema);
const DeviceCommand = mongoose.model('DeviceCommand', deviceCommandSchema);
const Station = mongoose.model('Station', stationSchema);
const Fare = mongoose.model('Fare', fareSchema);


app.post('/api/enroll', async (req, res) => {
  try {
    const fingerprintId = req.body.fingerprintId;
    

    const newUser = new User({
      name: `User ${fingerprintId}`, 
      email: `user${fingerprintId}@temp.com`, 
      fingerprintId: fingerprintId
    });
    
    await newUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Fingerprint enrolled successfully',
      fingerprintId
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling fingerprint',
      error: error.message
    });
  }
});

app.post('/api/verify', async (req, res) => {
  try {
    const { deviceId, fingerprintId, type, timestamp } = req.body;
    const sourceStation = "West Junction";
    const user = await User.findOne({ fingerprintId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (type === 'source') {
      const newTrip = new Trip({
        userId: user._id,
        fingerprintId,
        sourceStation,
        sourceTimestamp: new Date(),
        status: 'STARTED'
      });
      
      await newTrip.save();
      
      res.status(200).json({
        success: true,
        message: 'Source verified',
        tripId: newTrip._id,
        userId: user._id,
        requiresDestination: true
      });
    } 
    else if (type === 'destination') {
      const activeTrip = await Trip.findOne({
        userId: user._id,
        sourceStation,
        status: 'STARTED'
      }).sort({ sourceTimestamp: -1 });
      
      if (!activeTrip) {
        return res.status(404).json({
          success: false,
          message: 'No active trip found'
        });
      }
      
      const fare = await calculateFare(activeTrip.sourceStation, activeTrip.destinationStation);
      
      activeTrip.destinationTimestamp = new Date();
      activeTrip.fare = fare;
      activeTrip.status = 'COMPLETED';
      await activeTrip.save();
      
      user.balance -= fare;
      user.lastUpdated = new Date();
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Destination verified and fare deducted',
        fare,
        newBalance: user.balance
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing verification',
      error: error.message
    });
  }
});

app.get('/api/commands', async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    // Get the oldest unprocessed command for this device
    const command = await DeviceCommand.findOne({
      deviceId,
      processed: false
    }).sort({ createdAt: 1 });
    
    if (command) {
      // Mark command as processed
      command.processed = true;
      await command.save();
      
      res.status(200).json({
        command: command.command
      });
    } else {
      res.status(200).json({
        message: 'No commands available'
      });
    }
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching commands',
      error: error.message
    });
  }
});

app.post('/api/admin/user', async (req, res) => {
  try {
    const { fingerprintId, name, email, phone, balance } = req.body;
    
    // Find user by fingerprint ID
    const user = await User.findOne({ fingerprintId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user information
    user.name = name;
    user.email = email;
    user.phone = phone;
    if (balance !== undefined) {
      user.balance = balance;
    }
    user.lastUpdated = new Date();
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

app.post('/api/admin/enroll', async (req, res) => {
  try {
    const { deviceId } = req.body;
    
    // Create a command for the device
    const command = new DeviceCommand({
      deviceId,
      command: 'ENROLL'
    });
    
    await command.save();
    
    res.status(200).json({
      success: true,
      message: 'Enrollment command sent to device'
    });
  } catch (error) {
    console.error('Command creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending command to device',
      error: error.message
    });
  }
});

app.post('/api/admin/station', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    const station = new Station({ name, code });
    await station.save();
    
    res.status(201).json({
      success: true,
      message: 'Station added successfully',
      station
    });
  } catch (error) {
    console.error('Station creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding station',
      error: error.message
    });
  }
});

app.post('/api/admin/fare', async (req, res) => {
  try {
    const { sourceStation, destinationStation, fare } = req.body;
    
    // First check if both stations exist
    const sourceExists = await Station.findOne({ code: sourceStation });
    const destExists = await Station.findOne({ code: destinationStation });
    
    if (!sourceExists || !destExists) {
      return res.status(404).json({
        success: false,
        message: 'One or both stations not found'
      });
    }
    
    // Check if fare rule already exists
    let fareRule = await Fare.findOne({
      sourceStation,
      destinationStation
    });
    
    if (fareRule) {
      // Update existing rule
      fareRule.fare = fare;
      await fareRule.save();
    } else {
      // Create new rule
      fareRule = new Fare({
        sourceStation,
        destinationStation,
        fare
      });
      await fareRule.save();
      
      // Also create the reverse direction with the same fare
      // (unless it's the same station)
      if (sourceStation !== destinationStation) {
        const reverseFare = new Fare({
          sourceStation: destinationStation,
          destinationStation: sourceStation,
          fare
        });
        await reverseFare.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Fare rule saved successfully',
      fareRule
    });
  } catch (error) {
    console.error('Fare rule creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving fare rule',
      error: error.message
    });
  }
});

app.get('/api/stations', async (req, res) => {
  try {
    const stations = await Station.find().sort('name');
    
    res.status(200).json({
      success: true,
      stations
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stations',
      error: error.message
    });
  }
});

app.post('/api/trip/setDestination', async (req, res) => {
  try {
    const { tripId, destinationStation } = req.body;
    
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Set the destination station
    trip.destinationStation = destinationStation;
    await trip.save();
    
    // Send command to device for destination verification
    const device = await DeviceCommand.findOne({ 
      deviceId: req.body.deviceId || 'METRO_DEVICE_001' // Use default if not provided
    });
    
    const command = new DeviceCommand({
      deviceId: device ? device.deviceId : 'METRO_DEVICE_001',
      command: 'DESTINATION'
    });
    
    await command.save();
    
    res.status(200).json({
      success: true,
      message: 'Destination set, waiting for verification'
    });
  } catch (error) {
    console.error('Error setting destination:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting destination',
      error: error.message
    });
  }
});

app.post('/api/trip/start', async (req, res) => {
  try {
    const { deviceId } = req.body;
    
    // Send command to device for source verification
    const command = new DeviceCommand({
      deviceId: deviceId || 'METRO_DEVICE_001', // Use default if not provided
      command: 'SOURCE'
    });
    
    await command.save();
    
    res.status(200).json({
      success: true,
      message: 'Trip initialization started, waiting for fingerprint verification'
    });
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting trip',
      error: error.message
    });
  }
});

app.get('/api/trip/active', async (req, res) => {
  try {
    // In a real app, you'd get userId from auth token
    const trip = await Trip.findOne({
      status: 'STARTED'
    }).sort({ sourceTimestamp: -1 });
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'No active trip found'
      });
    }
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active trip',
      error: error.message
    });
  }
});

// Get trip by ID
app.get('/api/trip/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trip',
      error: error.message
    });
  }
});

// Add this to your backend (server.js)
// Add this endpoint to find the latest temporary user
app.get('/api/users/latest-temp', async (req, res) => {
  try {
    // Find the most recent temporary user (with temp email)
    const user = await User.findOne({ email: /temp\.com$/ })
                         .sort({ createdAt: -1 })
                         .limit(1);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No temporary users found'
      });
    }
    
    res.json({
      success: true,
      fingerprintId: user.fingerprintId,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error finding temporary user:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding temporary user',
      error: error.message
    });
  }
});

app.get('/api/user/:fingerprintId', async (req, res) => {
  try {
    const { fingerprintId } = req.params;
    
    const user = await User.findOne({ fingerprintId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        fingerprintId: user.fingerprintId
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Add this to your backend (server.js)
app.get('/api/trips', async (req, res) => {
  try {
    const { fingerprintId } = req.query;
    
    if (!fingerprintId) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint ID is required'
      });
    }

    const trips = await Trip.find({ fingerprintId })
      .sort({ sourceTimestamp: -1 }) // Newest first
      .limit(50); // Limit to 50 most recent trips

    res.json({
      success: true,
      trips
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trip history',
      error: error.message
    });
  }
});

app.post('/api/user/add-balance', async (req, res) => {
  try {
    const { fingerprintId, balance } = req.body;
    const user = await User.findOne({ fingerprintId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    user.balance += balance;
    user.lastUpdated = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Balance added successfully !',
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Error Adding Balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding balance',
      error: error.message
    });
  }
});

// Helper functions
async function calculateFare(sourceStation, destinationStation) {
  // Look up the fare in the database
  const fareRule = await Fare.findOne({
    sourceStation,
    destinationStation
  });
  
  if (fareRule) {
    return fareRule.fare;
  }
  
  // Default fare if rule not found
  return 20; // Default fare amount
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
