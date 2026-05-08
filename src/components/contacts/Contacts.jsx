import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import ContactTable from './ContactTable'
import ContactDetail from './ContactDetail'
import ImportCSV from './ImportCSV'

const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'
const CREAM = '#f4f1eb'
const BG = '#0f1d35'

export default function Contacts() {
  const addToast = useToast()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    if (fetchError) {
      setError(fetchError)
      addToast('Failed to load contacts', 'error')
    } else {
      setContacts(data || [])
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  const handleDelete = async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) {
      addToast('Failed to delete contact', 'error')
    } else {
      addToast('Contact deleted')
      setContacts(prev => prev.filter(c => c.id !== id))
      if (selectedContact?.id === id) setSelectedContact(null)
    }
  }

  const handleUpdate = (updated) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedContact(updated)
  }

  const handleImport = async (newContacts) => {
    const { data, error } = await supabase.from('contacts').insert(newContacts).select()
    if (error) {
      addToast('Import failed: ' + error.message, 'error')
    } else {
      addToast(`Imported ${data.length} contacts`)
      setContacts(prev => [...(data || []), ...prev])
    }
    setShowImport(false)
  }

  const handleNewContact = async () => {
    const blank = {
      name: 'New Contact',
      email: '',
      phone: '',
      company: '',
      role: '',
      source: 'Manual',
      notes: '',
      tags: [],
    }
    const { data, error } = await supabase.from('contacts').insert(blank).select().single()
    if (error) {
      addToast('Failed to create contact', 'error')
    } else {
      setContacts(prev => [data, ...prev])
      setSelectedContact(data)
      addToast('New contact created')
    }
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', color: CREAM, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid rgba(201,168,76,0.2)`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: CREAM }}>Contacts</h1>
          <span style={{
            background: GOLD, color: NAVY, borderRadius: 20, padding: '2px 12px',
            fontSize: 13, fontWeight: 700
          }}>
            {contacts.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '8px 16px', color: CREAM, fontSize: 14, width: 240,
              outline: 'none'
            }}
          />
          <button
            onClick={() => setShowImport(true)}
            style={{
              background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD,
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500
            }}
          >
            Import CSV
          </button>
          <button
            onClick={handleNewContact}
            style={{
              background: GOLD, color: NAVY, border: 'none', borderRadius: 8,
              padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700
            }}
          >
            + New Contact
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 32px' }}>
        <ErrorBanner error={error} onRetry={fetchContacts} />
        {loading ? (
          <div style={{ height: 200 }}>
            <LoadingScreen message="Loading contacts..." />
          </div>
        ) : (
          <ContactTable
            contacts={contacts}
            onSelect={setSelectedContact}
            onDelete={handleDelete}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* Detail Panel */}
      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportCSV
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
