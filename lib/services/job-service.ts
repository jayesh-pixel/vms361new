import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Job, CreateJobRequest, UpdateJobRequest, DynamicField, CreateDynamicFieldRequest } from '@/lib/types/jobs';

export class JobService {
  private static JOBS_COLLECTION = 'jobs';
  private static DYNAMIC_FIELDS_COLLECTION = 'dynamicFields';

  // Job CRUD Operations
  static async createJob(jobData: CreateJobRequest): Promise<string> {
    try {
      // Generate unique job ID
      const jobId = `JOB${Date.now()}`;
      
      const docRef = await addDoc(collection(db, this.JOBS_COLLECTION), {
        ...jobData,
        jobId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  static async updateJob(id: string, jobData: UpdateJobRequest): Promise<void> {
    try {
      const docRef = doc(db, this.JOBS_COLLECTION, id);
      await updateDoc(docRef, {
        ...jobData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  static async deleteJob(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.JOBS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  static async getJobById(id: string): Promise<Job | null> {
    try {
      const docRef = doc(db, this.JOBS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Job;
      }
      return null;
    } catch (error) {
      console.error('Error getting job:', error);
      throw error;
    }
  }

  static async getJobsByCompany(companyId: string): Promise<Job[]> {
    try {
      const q = query(
        collection(db, this.JOBS_COLLECTION), 
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Job));
    } catch (error) {
      console.error('Error getting jobs by company:', error);
      throw error;
    }
  }

  static async getJobsByShip(shipId: string): Promise<Job[]> {
    try {
      const q = query(
        collection(db, this.JOBS_COLLECTION), 
        where('shipId', '==', shipId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Job));
    } catch (error) {
      console.error('Error getting jobs by ship:', error);
      throw error;
    }
  }

  // Dynamic Fields Management
  static async createDynamicField(fieldData: CreateDynamicFieldRequest): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.DYNAMIC_FIELDS_COLLECTION), {
        ...fieldData,
        createdAt: new Date(),
        approved: false // Requires admin approval
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating dynamic field:', error);
      throw error;
    }
  }

  static async getDynamicFieldsByName(fieldName: string): Promise<DynamicField[]> {
    try {
      const q = query(
        collection(db, this.DYNAMIC_FIELDS_COLLECTION), 
        where('fieldName', '==', fieldName),
        where('approved', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as DynamicField));
    } catch (error) {
      console.error('Error getting dynamic fields:', error);
      throw error;
    }
  }

  static async approveDynamicField(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.DYNAMIC_FIELDS_COLLECTION, id);
      await updateDoc(docRef, {
        approved: true
      });
    } catch (error) {
      console.error('Error approving dynamic field:', error);
      throw error;
    }
  }

  // Default dropdown options
  static getDefaultOptions() {
    return {
      education: [
        "10th Class (X)",
        "12th Class (XII)",
        "Diploma",
        "Graduate",
        "Post Graduate",
        "PhD",
        "Marine Courses",
        "HND",
        "DNS",
        "B.Sc in Nautical Science",
        "GP Rating Course",
        "B.E Marine"
      ],
      function: [
        "Navigation",
        "Engineering",
        "Safety",
        "Deck Operations",
        "Engine Operations",
        "Communication",
        "Cargo Handling",
        "Port Operations"
      ],
      industry: [
        "Shipping",
        "Ports",
        "Marine Services",
        "Offshore",
        "Cruise",
        "Cargo",
        "Tanker Operations",
        "Container Shipping"
      ],
      role: [
        "Marine Engineer",
        "Engine Technician",
        "Chief Engineer",
        "Second Engineer",
        "Third Engineer",
        "Deck Officer",
        "Captain",
        "Chief Officer",
        "Second Officer",
        "Third Officer",
        "Deck Cadet",
        "Engine Cadet",
        "Trainee OS",
        "Wiper",
        "Oiler",
        "Bosun"
      ],
      skills: [
        "Nautical",
        "GME",
        "Wiper",
        "Marine",
        "Shipping",
        "Oiler",
        "Navigation",
        "Safety Management",
        "Cargo Operations",
        "Port Operations",
        "G.P Rating",
        "Indian CDC",
        "Panama CDC",
        "Liberian CDC"
      ],
      jobType: [
        "Permanent Job",
        "Contract Job",
        "Part-time",
        "Internship"
      ],
      category: [
        "Deck",
        "Engine",
        "Catering",
        "Safety",
        "Navigation",
        "Operations"
      ]
    };
  }
}
