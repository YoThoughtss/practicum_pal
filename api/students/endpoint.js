// Example in your backend (api/students/[id].js)
import { getStudentData } from '../../backend/students/studentData';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const studentData = await getStudentData(id);
    if (studentData) {
      res.status(200).json(studentData);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student data', error: error.message });
  }
}