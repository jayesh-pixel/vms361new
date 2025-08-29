"use client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Briefcase,
  Plus, 
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Users,
  Building,
  Calendar,
  Clock,
  Star,
  Ship,
  Filter
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useShips } from "@/hooks/use-ships"
import { useAuth } from "@/hooks/use-auth"
import { Job, CreateJobRequest, JobType } from "@/lib/types/jobs"
import { JobService } from "@/lib/services/job-service"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { toast } from "sonner"

// Form schemas
const jobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  subtitle: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  category: z.string().min(1, "Category is required"),
  jobType: z.enum(["Permanent Job", "Contract Job", "Part-time", "Internship"]),
  company: z.string().min(1, "Company name is required"),
  imageUrl: z.string().optional(),
  rating: z.string().optional(),
  jobDescription: z.string().min(1, "Job description is required"),
  location: z.string().min(1, "Location is required"),
  salaryMin: z.number().min(0, "Minimum salary must be positive"),
  salaryMax: z.number().min(0, "Maximum salary must be positive"),
  currency: z.string().default("USD"),
  shipId: z.string().optional(),
  education: z.array(z.string()).optional(),
  function: z.array(z.string()).optional(),
  industry: z.array(z.string()).optional(),
  role: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional()
}).refine((data) => data.salaryMax >= data.salaryMin, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salaryMax"]
})

export default function JobsPage() {
  const { user } = useAuth()
  const { userPermissions } = usePermissions()
  const { ships } = useShips()
  
  // Local state
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [shipFilter, setShipFilter] = useState("all")
  
  // Dialog states
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false)
  const [showEditJobDialog, setShowEditJobDialog] = useState(false)
  const [showViewJobDialog, setShowViewJobDialog] = useState(false)
  const [showDeleteJobDialog, setShowDeleteJobDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  
  // Multi-select options
  const [selectedOptions, setSelectedOptions] = useState<{[key: string]: string[]}>({
    education: [],
    function: [],
    industry: [],
    role: [],
    skills: [],
    category: []
  })
  const [customFields, setCustomFields] = useState<{[key: string]: string}>({})
  const [availableOptions, setAvailableOptions] = useState<{[key: string]: string[]}>(JobService.getDefaultOptions())
  
  // Form setup
  const jobForm = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      position: "",
      category: "",
      jobType: "Permanent Job",
      company: "",
      imageUrl: "",
      rating: "",
      jobDescription: "",
      location: "",
      salaryMin: 400,
      salaryMax: 5000,
      currency: "USD",
      shipId: "none",
      education: [],
      function: [],
      industry: [],
      role: [],
      skills: []
    }
  })

  // Load jobs on component mount
  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const jobsData = await JobService.getAllJobs()
      setJobs(jobsData)
    } catch (error: any) {
      console.error("Failed to load jobs:", error)
      setError("Failed to load jobs: " + error.message)
      toast.error("Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async (data: z.infer<typeof jobSchema>) => {
    try {
      console.log("Creating job with data:", data)
      
      const jobData: CreateJobRequest = {
        title: data.title,
        subtitle: data.subtitle || "",
        position: data.position,
        category: data.category,
        jobType: data.jobType as JobType,
        company: data.company,
        companyId: userPermissions?.companyId || "",
        imageUrl: data.imageUrl || "",
        rating: data.rating || "",
        jobDescription: data.jobDescription,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        education: selectedOptions.education,
        function: selectedOptions.function,
        industry: selectedOptions.industry,
        role: selectedOptions.role,
        skills: selectedOptions.skills,
        shipId: data.shipId && data.shipId !== "none" ? data.shipId : undefined,
        createdBy: user?.uid || "",
        status: 'active'
      }

      await JobService.createJob(jobData)
      toast.success("Job posted successfully!")
      setShowCreateJobDialog(false)
      resetJobForm()
      await loadJobs() // Reload jobs
    } catch (error: any) {
      console.error("Failed to create job:", error)
      toast.error("Failed to post job: " + error.message)
    }
  }

  const handleEditJob = (job: Job) => {
    setSelectedJob(job)
    
    // Pre-populate form
    jobForm.reset({
      title: job.title,
      subtitle: job.subtitle || "",
      position: job.position,
      category: job.category,
      jobType: job.jobType,
      company: job.company,
      imageUrl: job.imageUrl || "",
      rating: job.rating || "",
      jobDescription: job.jobDescription,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      shipId: job.shipId || "none"
    })
    
    // Set selected options
    setSelectedOptions({
      education: job.education || [],
      function: job.function || [],
      industry: job.industry || [],
      role: job.role || [],
      skills: job.skills || [],
      category: [job.category]
    })
    
    setShowEditJobDialog(true)
  }

  const handleUpdateJob = async (data: z.infer<typeof jobSchema>) => {
    if (!selectedJob) return
    
    try {
      const updateData = {
        title: data.title,
        subtitle: data.subtitle || "",
        position: data.position,
        category: data.category,
        jobType: data.jobType as JobType,
        company: data.company,
        imageUrl: data.imageUrl || "",
        rating: data.rating || "",
        jobDescription: data.jobDescription,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        education: selectedOptions.education,
        function: selectedOptions.function,
        industry: selectedOptions.industry,
        role: selectedOptions.role,
        skills: selectedOptions.skills,
        shipId: data.shipId && data.shipId !== "none" ? data.shipId : undefined
      }

      await JobService.updateJob(selectedJob.id, updateData)
      toast.success("Job updated successfully!")
      setShowEditJobDialog(false)
      resetJobForm()
      await loadJobs()
    } catch (error: any) {
      console.error("Failed to update job:", error)
      toast.error("Failed to update job: " + error.message)
    }
  }

  const handleDeleteJob = (job: Job) => {
    setSelectedJob(job)
    setShowDeleteJobDialog(true)
  }

  const confirmDeleteJob = async () => {
    if (!selectedJob) return
    
    try {
      await JobService.deleteJob(selectedJob.id)
      toast.success("Job deleted successfully!")
      setShowDeleteJobDialog(false)
      setSelectedJob(null)
      await loadJobs()
    } catch (error: any) {
      console.error("Failed to delete job:", error)
      toast.error("Failed to delete job: " + error.message)
    }
  }

  const handleViewJob = (job: Job) => {
    setSelectedJob(job)
    setShowViewJobDialog(true)
  }

  const resetJobForm = () => {
    jobForm.reset()
    setSelectedOptions({
      education: [],
      function: [],
      industry: [],
      role: [],
      skills: [],
      category: []
    })
    setCustomFields({})
    setSelectedJob(null)
  }

  const handleOptionToggle = (fieldName: string, option: string) => {
    setSelectedOptions(prev => {
      const currentOptions = prev[fieldName] || []
      return {
        ...prev,
        [fieldName]: currentOptions.includes(option) 
          ? currentOptions.filter(item => item !== option)
          : [...currentOptions, option]
      }
    })
  }

  const handleAddCustomField = async (fieldName: string) => {
    const newFieldValue = customFields[fieldName]
    if (!newFieldValue || !newFieldValue.trim()) {
      toast.error("Please enter a valid field value")
      return
    }

    try {
      await JobService.createDynamicField({
        fieldName,
        fieldValue: newFieldValue.trim(),
        createdBy: user?.uid || ""
      })

      setAvailableOptions(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], newFieldValue.trim()]
      }))

      setSelectedOptions(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], newFieldValue.trim()]
      }))

      setCustomFields(prev => ({
        ...prev,
        [fieldName]: ""
      }))

      toast.success("Custom field added!")
    } catch (error: any) {
      toast.error("Failed to add custom field: " + error.message)
    }
  }

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesCategory = categoryFilter === "all" || job.category === categoryFilter
    const matchesShip = shipFilter === "all" || 
                       (shipFilter === "none" && !job.shipId) || 
                       job.shipId === shipFilter
    
    return matchesSearch && matchesStatus && matchesCategory && matchesShip
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      expired: "destructive",
      draft: "outline"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getJobTypeBadge = (jobType: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Permanent Job": "default",
      "Contract Job": "secondary",
      "Part-time": "outline",
      "Internship": "destructive"
    }
    return <Badge variant={variants[jobType] || "outline"}>{jobType}</Badge>
  }

  const renderMultiSelectField = (fieldName: string, label: string) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedOptions[fieldName]?.map((option, index) => (
          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleOptionToggle(fieldName, option)}>
            {option} ×
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
        {availableOptions[fieldName]?.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={`${fieldName}-${index}`}
              checked={selectedOptions[fieldName]?.includes(option)}
              onCheckedChange={() => handleOptionToggle(fieldName, option)}
            />
            <label htmlFor={`${fieldName}-${index}`} className="text-xs">{option}</label>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={`Add custom ${label.toLowerCase()}`}
          value={customFields[fieldName] || ""}
          onChange={(e) => setCustomFields(prev => ({ ...prev, [fieldName]: e.target.value }))}
          className="text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddCustomField(fieldName)}
        >
          Add
        </Button>
      </div>
    </div>
  )

  return (
    <DashboardLayout currentPage="jobs">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Job Management</h1>
            <p className="text-slate-600 mt-1">Post and manage job opportunities</p>
          </div>
          <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post New Job</DialogTitle>
                <DialogDescription>
                  Create a new job posting
                </DialogDescription>
              </DialogHeader>
              <Form {...jobForm}>
                <form onSubmit={jobForm.handleSubmit(handleCreateJob)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={jobForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Marine Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Senior Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={jobForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company *</FormLabel>
                            <FormControl>
                              <Input placeholder="Company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="jobType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select job type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Permanent Job">Permanent Job</SelectItem>
                                <SelectItem value="Contract Job">Contract Job</SelectItem>
                                <SelectItem value="Part-time">Part-time</SelectItem>
                                <SelectItem value="Internship">Internship</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={jobForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Mumbai, India" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="shipId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ship (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select ship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No specific ship</SelectItem>
                                {ships.map((ship) => (
                                  <SelectItem key={ship.id} value={ship.id}>
                                    {ship.name} - {ship.imo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Salary Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Salary Information</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={jobForm.control}
                        name="salaryMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Salary *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="400"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="salaryMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Salary *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="5000"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="INR">INR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Job Description</h3>
                    <FormField
                      control={jobForm.control}
                      name="jobDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed job description..."
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Multi-select Fields */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Requirements & Skills</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {renderMultiSelectField("education", "Education")}
                      {renderMultiSelectField("skills", "Skills")}
                      {renderMultiSelectField("function", "Function")}
                      {renderMultiSelectField("role", "Role")}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      {renderMultiSelectField("industry", "Industry")}
                      <div className="space-y-2">
                        <FormField
                          control={jobForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Engineering">Engineering</SelectItem>
                                  <SelectItem value="Navigation">Navigation</SelectItem>
                                  <SelectItem value="Deck">Deck</SelectItem>
                                  <SelectItem value="Catering">Catering</SelectItem>
                                  <SelectItem value="Management">Management</SelectItem>
                                  <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateJobDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Post Job
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
                  <p className="text-sm text-slate-600">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{jobs.filter(j => j.status === 'active').length}</p>
                  <p className="text-sm text-slate-600">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Ship className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{jobs.filter(j => j.shipId).length}</p>
                  <p className="text-sm text-slate-600">Ship-specific</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{jobs.filter(j => j.status === 'draft').length}</p>
                  <p className="text-sm text-slate-600">Draft Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Job Postings</CardTitle>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Navigation">Navigation</SelectItem>
                    <SelectItem value="Deck">Deck</SelectItem>
                    <SelectItem value="Catering">Catering</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={shipFilter} onValueChange={setShipFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ships</SelectItem>
                    <SelectItem value="none">No Ship</SelectItem>
                    {ships.map((ship) => (
                      <SelectItem key={ship.id} value={ship.id}>
                        {ship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p>{error}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Ship</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.position}</TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{getJobTypeBadge(job.jobType)}</TableCell>
                      <TableCell>{job.category}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {job.salaryMin}-{job.salaryMax} {job.currency}
                      </TableCell>
                      <TableCell>
                        {job.shipId ? (
                          <div className="flex items-center gap-1">
                            <Ship className="h-3 w-3" />
                            {ships.find(s => s.id === job.shipId)?.name || 'Unknown'}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{format(job.createdAt, "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewJob(job)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditJob(job)}
                            title="Edit Job"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteJob(job)}
                            title="Delete Job"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!loading && !error && filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Jobs Found</h3>
                <p className="text-slate-600">Start by posting your first job opportunity.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Job Dialog */}
        <Dialog open={showViewJobDialog} onOpenChange={setShowViewJobDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{selectedJob.title}</h3>
                    {getStatusBadge(selectedJob.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-500">Position</label>
                      <p>{selectedJob.position}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500">Company</label>
                      <p>{selectedJob.company}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500">Job Type</label>
                      <p>{selectedJob.jobType}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500">Category</label>
                      <p>{selectedJob.category}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500">Location</label>
                      <p>{selectedJob.location}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500">Salary</label>
                      <p>{selectedJob.salaryMin}-{selectedJob.salaryMax} {selectedJob.currency}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedJob.jobDescription}</p>
                </div>

                {selectedJob.education && selectedJob.education.length > 0 && (
                  <div>
                    <label className="font-medium text-gray-500">Education</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedJob.education.map((edu, index) => (
                        <Badge key={index} variant="secondary">{edu}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div>
                    <label className="font-medium text-gray-500">Skills</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedJob.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.shipId && (
                  <div>
                    <label className="font-medium text-gray-500">Ship</label>
                    <p className="mt-1">{ships.find(s => s.id === selectedJob.shipId)?.name || 'Unknown Ship'}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog */}
        <Dialog open={showEditJobDialog} onOpenChange={setShowEditJobDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
            </DialogHeader>
            <Form {...jobForm}>
              <form onSubmit={jobForm.handleSubmit(handleUpdateJob)} className="space-y-6">
                {/* Same form fields as create dialog */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={jobForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Marine Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Senior Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditJobDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Job
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Job Dialog */}
        <Dialog open={showDeleteJobDialog} onOpenChange={setShowDeleteJobDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Job</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this job posting? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium">{selectedJob.title}</h4>
                  <p className="text-sm text-gray-600">{selectedJob.position} at {selectedJob.company}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteJobDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDeleteJob}>
                    Delete Job
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
