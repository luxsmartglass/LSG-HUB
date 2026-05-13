import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import { useIsMobile, useIsNarrow } from '../../hooks/useMediaQuery'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import ContactTable from './ContactTable'
import ContactDetail from './ContactDetail'
import ImportCSV from './ImportCSV'

export default function Contacts() {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const isNarrow = useIsNarrow()
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
  const deleteTimers = useRef([])

  useEffect(() => {
    return () => { deleteTimers.current.forEach(id => clearTimeout(id)) }
  }, [])

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

  const handleDelete = (id) => {
    const removed = contacts.find(c => c.id === id)
    if (!removed) {
      supabase.from('contacts').delete().eq('id', id).then(({ error }) => {
        if (error) addToast('Failed to delete contact', 'error')
      })
      return
    }
    setContacts(prev => prev.filter(c => c.id !== id))
    if (selectedContact?.id === id) setSelectedContact(null)
    const timer = setTimeout(async () => {
      deleteTimers.current = deleteTimers.current.filter(t => t !== timer)
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) {
        addToast('Failed to delete contact', 'error')
        setContacts(prev => [...prev, removed])
      }
    }, 6000)
    deleteTimers.current.push(timer)
    addToast('Contact deleted', 'success', {
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timer)
          deleteTimers.current = deleteTimers.current.filter(t => t !== timer)
          setContacts(prev => prev.some(c => c.id === id) ? prev : [...prev, removed])
        },
      },
      duration: 6000,
    })
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
        padding: isMobile ? '16px 16px' : '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: isMobile ? 10 : 0,
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
        <div style={{
          display: 'flex', gap: isMobile ? 8 : 12, alignItems: 'center',
          flexWrap: 'wrap', flex: isMobile ? '1 1 100%' : undefined,
        }}>
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: isNarrow ? undefined : 240, flex: isNarrow ? '1 1 100%' : undefined }}
          />
          <Button variant="ghost" size={isMobile ? 'sm' : undefined} onClick={() => setShowImport(true)}>
            Import CSV
          </Button>
          <Button variant="primary" size={isMobile ? 'sm' : undefined} onClick={() => setCreating(true)}>
            + New Contact
          </Button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: isMobile ? '16px 16px' : '24px 32px' }}>
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
