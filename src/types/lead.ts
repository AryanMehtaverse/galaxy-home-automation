export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Interested'
  | 'Call Back Later'
  | 'Site Visit Required'
  | 'Quotation Requested'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Not Interested'

export type LeadSource =
  | 'IndiaMART'
  | 'Meta Ads'
  | 'Google Ads'
  | 'Website'
  | 'Referral'
  | 'Architect'
  | 'Builder'
  | 'JustDial'
  | 'Cold Calling'
  | 'Walk In'
  | 'Manual Entry'
  | 'Other'

export type PropertyType =
  | '1 BHK'
  | '2 BHK'
  | '3 BHK'
  | '4 BHK'
  | 'Villa'
  | 'Office'
  | 'Commercial'
  | 'Other'

export type CallOutcome =
  | 'No Answer'
  | 'Busy'
  | 'Interested'
  | 'Call Back Later'
  | 'Quotation Requested'
  | 'Site Visit Required'
  | 'Not Interested'
  | 'Wrong Number'

export type Priority = 'High' | 'Medium' | 'Low'

export interface Lead {
  id: string
  name: string
  phone: string
  whatsapp?: string
  email?: string
  city: string
  address?: string
  source: LeadSource
  propertyType: PropertyType
  budget?: string
  assignedTo?: string
  notes?: string
  status: LeadStatus
  createdAt: string
  updatedAt: string
  lastCallDate?: string
  lastCallOutcome?: CallOutcome
  nextFollowUpDate?: string
  nextFollowUpTime?: string
  priority?: Priority
  totalCalls: number
}

export interface CallLog {
  id: string
  leadId: string
  date: string
  time: string
  outcome: CallOutcome
  notes?: string
  nextFollowUpDate?: string
  nextFollowUpTime?: string
  priority?: Priority
  createdAt: string
}
