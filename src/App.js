import './App.css';
import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";

/************************************
 * Helpers
 ************************************/
function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function useUsersFiltered(users, search) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);
}

/************************************
 * Components
 ************************************/
function Header({ count }) {
  return (
    <header>
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
    />
  );
}

function AddUserButton({ addUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-indigo-600 text-white">
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
    addUser({ id: Date.now(), name, email, company });
    onClose();
  };

  return (
    <div className="fixed" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h3>Add a new User</h3>
        <label>
          Name *
          <input
            className={classNames(touched && errors.name && "border-red-500")}
            value={name} onChange={e => setName(e.target.value)} />
          {touched && errors.name && <div className="text-red-600">{errors.name}</div>}
        </label>
        <label>
          Email *
          <input
            className={classNames(touched && errors.email && "border-red-500")}
            value={email} onChange={e => setEmail(e.target.value)} />
          {touched && errors.email && <div className="text-red-600">{errors.email}</div>}
        </label>
        <label>
          Company
          <input value={company} onChange={e => setCompany(e.target.value)} />
        </label>
        <div>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Add</button>
        </div>
      </form>
    </div>
  );
}

function UsersTable({ users, navigate }) {
  if (!users.length) return <div className="text-center py-10 text-gray-500">No users found.</div>;
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Company</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id} className="hover:bg-gray-100">
            <td>
              <button className="text-indigo-700" onClick={() => navigate(`/users/${u.id}`)}>
                {u.name}
              </button>
            </td>
            <td>{u.email}</td>
            <td>{u.company || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/************************************
 * Pages
 ************************************/
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
        phone: u.phone,
        website: u.website,
        address: u.address
      }))));
  }, []);

  const addUser = (user) => setUsers([user, ...users]);
  const filteredUsers = useUsersFiltered(users, search);

  return (
    <main>
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
