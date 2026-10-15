import mongoose from 'mongoose'

// Define the blueprint (Schema) for storing meeting records in MongoDB
const MeetingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  hostName: {
    type: String,
    default: 'Anonymous'
  },
  participants: {
    type: [String],
    default: []
  },
  summary: {
    type: String,
    default: ''
  },
  keyDecisions: {
    type: [String],
    default: []
  },
  actionItems: [
    {
      id: Number,
      text: String,
      assignee: String,
      completed: {
        type: Boolean,
        default: false
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Meeting', MeetingSchema)
