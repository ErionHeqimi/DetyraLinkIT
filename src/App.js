import './App.css';
import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";

/************************************
 * Hooks & helpers
 ************************************/
function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function useUsersFiltered(users, search) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);
}

/************************************
 * Components
 ************************************/
function Header({ count }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold">Users ({count})</h1>
      <nav>
        <Link to="/">List</Link>
      </nav>
    </header>
  );
}

function SearchBar({ search, setSearch }) {
  return (
    <input
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Search by name or email…"
      className="w-full max-w-md rounded-2xl border px-4 py-2 mb-4"
    />
  );
}

function AddUserButton({ addUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl px-4 py-2 bg-indigo-600 text-white mb-4"
      >
        + Add User
      </button>
      {open && <UserForm onClose={() => setOpen(false)} addUser={addUser} />}
    </>
  );
}

function UserForm({ onClose, addUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const es = {};
    if (!name.trim()) es.name = "Name is required";
    if (!email.trim()) es.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) es.email = "Invalid email";
    return es;
  }, [name, email]);

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;
    addUser({ name, email, company });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-3xl shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Add a new User</h3>
        <label className="block mb-2">
          Name *
          <input
            className={classNames("w-full border rounded-xl px-3 py-2", touched && errors.name && "border-red-500")}
            value={name} onChange={e => setName(e.target.value)} />
          {touched && errors.name && <div className="text-red-600 text-xs">{errors.name}</div>}
        </label>
        <label className="block mb-2">
          Email *
          <input
            className={classNames("w-full border rounded-xl px-3 py-2", touched && errors.email && "border-red-500")}
            value={email} onChange={e => setEmail(e.target.value)} />
          {touched && errors.email && <div className="text-red-600 text-xs">{errors.email}</div>}
        </label>
        <label className="block mb-4">
          Company
          <input className="w-full border rounded-xl px-3 py-2" value={company} onChange={e => setCompany(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border rounded-xl px-4 py-2">Cancel</button>
          <button type="submit" className="bg-indigo-600 text-white rounded-xl px-4 py-2">Add</button>
        </div>
      </form>
    </div>
  );
}

function UsersTable({ users, navigate }) {
  if (!users.length) return <div className="text-center py-10 text-gray-500">No users found.</div>;
  return (
    <table className="w-full border rounded-2xl overflow-x-auto">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left px-4 py-2">Name</th>
          <th className="text-left px-4 py-2">Email</th>
          <th className="text-left px-4 py-2">Company</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id} className="hover:bg-gray-100">
            <td className="px-4 py-2">
              <button className="text-indigo-700" onClick={() => navigate(`/users/${u.id}`)}>{u.name}</button>
            </td>
            <td className="px-4 py-2">{u.email}</td>
            <td className="px-4 py-2">{u.company || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ListPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then(res => res.json())
      .then(data => setUsers(data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        company: u.company?.name || "—",
        phone: u.phone || "—",
        website: u.website || "—",
        address: u.address || null
      }))));
  }, []);

  const addUser = ({ name, email, company }) => {
    setUsers([{ id: Date.now(), name, email, company }, ...users]);
  };

  const filteredUsers = useUsersFiltered(users, search);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <SearchBar search={search} setSearch={setSearch} />
      <AddUserButton addUser={addUser} />
      <UsersTable users={filteredUsers} navigate={navigate} />
    </main>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium col-span-2">{value || "—"}</div>
    </div>
  );
}

function UserDetailsPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
      .then(res => res.json())
      .then(u => setUser(u));
  }, [id]);

  if (!user) return <div className="text-center py-10">Loading...</div>;

  const addressText = user.address
    ? `${user.address.street}, ${user.address.suite}, ${user.address.city} ${user.address.zipcode}`
    : "—";

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-4 border rounded-xl px-3 py-1.5">← Back</button>
      <div className="rounded-2xl border p-6 bg-white">
        <h1 className="text-2xl font-semibold mb-1">{user.name}</h1>
        <p className="text-gray-600 mb-4">{user.company?.name}</p>
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Phone" value={user.phone} />
        <DetailRow label="Website" value={user.website} />
        <DetailRow label="Address" value={addressText} />
      </div>
    </main>
  );
}

/************************************
 * App root
 ************************************/
export default function App() {
  return (
    <BrowserRouter>
      <Header count={0} />
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route path="*" element={<div className="text-center py-10">Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
