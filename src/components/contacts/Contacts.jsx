import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import ContactTable from './ContactTable'
import ContactDetail from './ContactDetail'
import ImportCSV from './ImportCSV'

export default function Contacts() {
  const { c } = useTheme()
  const addToast = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [creating, setCreating] = useState(false)

  // Honor ?new=1 from command palette / quick-create
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('new') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: URL param triggers UI state, then param is cleared
      setCreating(true)
      navigate('/contacts', { replace: true })
    }
  }, [location.search, navigate])

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

  useEffect(() => { fetchContacts() }, [fetchContacts]) // eslint-disable-line react-hooks/set-state-in-effect -- intentional: load on mount; fetchContacts is async

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

  const handleCreateContact = async (form) => {
    // Build record with only real columns; drop empty strings
    const record = {}
    const REAL_COLUMNS = ['name', 'company', 'role', 'email', 'phone', 'source', 'tags']
    REAL_COLUMNS.forEach(key => {
      const val = form[key]
      if (val !== undefined && val !== null && val !== '') {
        record[key] = val
      }
    })

    const { data, error } = await supabase.from('contacts').insert(record).select()
    if (error) {
      addToast(error.message, 'error')
      return
    }
    const created = data?.[0]
    if (created) {
      setContacts(p => [created, ...p])
      setSelectedContact(created)
    }
    setCreating(false)
    addToast('Contact created')
  }

  return (
    <div
      className="fade-up"
      style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, fontFamily: c.font.body }}
    >
      {/* Header */}
      <div style={{
        background: c.surface,
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: c.text.xl, fontWeight: c.weight.hero, color: c.textPrimary, fontFamily: c.font.heading }}>
            Contacts
          </h1>
          <span style={{
            background: c.accent, color: c.accentText,
            borderRadius: c.radius.pill, padding: '2px 12px',
            fontSize: c.text.sm, fontWeight: c.weight.label,
          }}>
            {contacts.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 240 }}
          />
          <Button variant="ghost" onClick={() => setShowImport(true)}>
            Import CSV
          </Button>
          <Button variant="primary" onClick={() => setCreating(true)}>
            + New Contact
          </Button>
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

      {/* Create Panel */}
      {creating && (
        <ContactDetail
          mode="create"
          contact={null}
          onClose={() => setCreating(false)}
          onCreate={handleCreateContact}
        />
      )}

      {/* Detail Panel */}
      {selectedContact && !creating && (
        <ContactDetail
          mode="edit"
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
