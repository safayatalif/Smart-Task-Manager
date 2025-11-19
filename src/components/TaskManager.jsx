import React, { useState, useEffect } from 'react';
import { Users, Briefcase, CheckSquare, Activity, Plus, Edit2, Trash2, LogOut, AlertCircle } from 'lucide-react';

const TaskManager = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [view, setView] = useState('login');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [filterProject, setFilterProject] = useState('all');
    const [filterMember, setFilterMember] = useState('all');

    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [teamForm, setTeamForm] = useState({ name: '', members: [{ name: '', role: '', capacity: 3 }] });
    const [projectForm, setProjectForm] = useState({ name: '', description: '', teamId: '' });
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        priority: 'Medium',
        status: 'Pending'
    });
    const [warningMessage, setWarningMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [usersData, teamsData, projectsData, tasksData, logData] = await Promise.all([
                    window.storage.get('users').catch(() => null),
                    window.storage.get('teams').catch(() => null),
                    window.storage.get('projects').catch(() => null),
                    window.storage.get('tasks').catch(() => null),
                    window.storage.get('activityLog').catch(() => null)
                ]);

                if (usersData) setUsers(JSON.parse(usersData.value));
                if (teamsData) setTeams(JSON.parse(teamsData.value));
                if (projectsData) setProjects(JSON.parse(projectsData.value));
                if (tasksData) setTasks(JSON.parse(tasksData.value));
                if (logData) setActivityLog(JSON.parse(logData.value));
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    const saveData = async (key, data) => {
        try {
            await window.storage.set(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
        }
    };

    useEffect(() => {
        if (users.length > 0) saveData('users', users);
    }, [users]);

    useEffect(() => {
        if (teams.length > 0) saveData('teams', teams);
    }, [teams]);

    useEffect(() => {
        if (projects.length > 0) saveData('projects', projects);
    }, [projects]);

    useEffect(() => {
        if (tasks.length > 0) saveData('tasks', tasks);
    }, [tasks]);

    useEffect(() => {
        if (activityLog.length > 0) saveData('activityLog', activityLog);
    }, [activityLog]);

    const handleRegister = () => {
        if (registerForm.password !== registerForm.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        if (users.find(u => u.username === registerForm.username)) {
            alert('Username already exists');
            return;
        }
        const newUser = {
            id: Date.now().toString(),
            username: registerForm.username,
            password: registerForm.password
        };
        setUsers([...users, newUser]);
        setRegisterForm({ username: '', password: '', confirmPassword: '' });
        setView('login');
    };

    const handleLogin = () => {
        const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
        if (user) {
            setCurrentUser(user);
            setView('dashboard');
            setLoginForm({ username: '', password: '' });
        } else {
            alert('Invalid credentials');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setView('login');
    };

    const handleAddTeamMember = () => {
        setTeamForm({
            ...teamForm,
            members: [...teamForm.members, { name: '', role: '', capacity: 3 }]
        });
    };

    const handleTeamMemberChange = (index, field, value) => {
        const newMembers = [...teamForm.members];
        newMembers[index][field] = field === 'capacity' ? parseInt(value) : value;
        setTeamForm({ ...teamForm, members: newMembers });
    };

    const handleRemoveTeamMember = (index) => {
        const newMembers = teamForm.members.filter((_, i) => i !== index);
        setTeamForm({ ...teamForm, members: newMembers });
    };

    const handleSaveTeam = () => {
        if (!teamForm.name || teamForm.members.some(m => !m.name || !m.role)) {
            alert('Please fill all fields');
            return;
        }

        if (editingItem) {
            setTeams(teams.map(t => t.id === editingItem.id ? { ...teamForm, id: editingItem.id, userId: currentUser.id } : t));
        } else {
            const newTeam = { ...teamForm, id: Date.now().toString(), userId: currentUser.id };
            setTeams([...teams, newTeam]);
        }

        setShowModal(false);
        setTeamForm({ name: '', members: [{ name: '', role: '', capacity: 3 }] });
        setEditingItem(null);
    };

    const handleSaveProject = () => {
        if (!projectForm.name || !projectForm.teamId) {
            alert('Please fill all required fields');
            return;
        }

        if (editingItem) {
            setProjects(projects.map(p => p.id === editingItem.id ? { ...projectForm, id: editingItem.id, userId: currentUser.id } : p));
        } else {
            const newProject = { ...projectForm, id: Date.now().toString(), userId: currentUser.id };
            setProjects([...projects, newProject]);
        }

        setShowModal(false);
        setProjectForm({ name: '', description: '', teamId: '' });
        setEditingItem(null);
    };

    const getMemberTaskCount = (memberId, projectId) => {
        return tasks.filter(t => t.assignedTo === memberId && t.projectId === projectId).length;
    };

    const handleTaskFormChange = (field, value) => {
        const newForm = { ...taskForm, [field]: value };

        if (field === 'projectId') {
            newForm.assignedTo = '';
            setWarningMessage('');
        }

        if (field === 'assignedTo' && value && newForm.projectId) {
            const project = projects.find(p => p.id === newForm.projectId);
            const team = teams.find(t => t.id === project.teamId);
            const member = team.members.find(m => m.name === value);
            const currentTasks = getMemberTaskCount(value, newForm.projectId);

            if (currentTasks >= member.capacity) {
                setWarningMessage(`${member.name} has ${currentTasks} tasks but capacity is ${member.capacity}. Assign anyway?`);
            } else {
                setWarningMessage('');
            }
        }

        setTaskForm(newForm);
    };

    const handleAutoAssign = () => {
        if (!taskForm.projectId) {
            alert('Please select a project first');
            return;
        }

        const project = projects.find(p => p.id === taskForm.projectId);
        const team = teams.find(t => t.id === project.teamId);

        let minLoad = Infinity;
        let bestMember = null;

        team.members.forEach(member => {
            const currentTasks = getMemberTaskCount(member.name, taskForm.projectId);
            const load = currentTasks / member.capacity;
            if (load < minLoad) {
                minLoad = load;
                bestMember = member.name;
            }
        });

        if (bestMember) {
            handleTaskFormChange('assignedTo', bestMember);
        }
    };

    const handleSaveTask = () => {
        if (!taskForm.title || !taskForm.projectId) {
            alert('Please fill all required fields');
            return;
        }

        if (editingItem) {
            setTasks(tasks.map(t => t.id === editingItem.id ? { ...taskForm, id: editingItem.id } : t));
        } else {
            const newTask = { ...taskForm, id: Date.now().toString() };
            setTasks([...tasks, newTask]);
        }

        setShowModal(false);
        setTaskForm({ title: '', description: '', projectId: '', assignedTo: '', priority: 'Medium', status: 'Pending' });
        setEditingItem(null);
        setWarningMessage('');
    };

    const handleDeleteTask = (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    const handleEditTask = (task) => {
        setEditingItem(task);
        setTaskForm(task);
        setModalType('task');
        setShowModal(true);
    };

    const handleReassignTasks = () => {
        const userProjects = projects.filter(p => p.userId === currentUser.id);
        let reassignments = [];

        userProjects.forEach(project => {
            const team = teams.find(t => t.id === project.teamId);
            if (!team) return;

            const memberLoads = team.members.map(member => ({
                name: member.name,
                capacity: member.capacity,
                tasks: tasks.filter(t => t.projectId === project.id && t.assignedTo === member.name && t.priority !== 'High')
            }));

            memberLoads.forEach(member => {
                while (member.tasks.length > member.capacity) {
                    const taskToMove = member.tasks.pop();

                    const availableMember = memberLoads.find(m =>
                        m.name !== member.name &&
                        tasks.filter(t => t.projectId === project.id && t.assignedTo === m.name).length < m.capacity
                    );

                    if (availableMember) {
                        const updatedTask = { ...taskToMove, assignedTo: availableMember.name };
                        setTasks(prev => prev.map(t => t.id === taskToMove.id ? updatedTask : t));

                        const logEntry = {
                            id: Date.now().toString() + Math.random(),
                            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            message: `Task "${taskToMove.title}" reassigned from ${member.name} to ${availableMember.name}`
                        };
                        reassignments.push(logEntry);
                    }
                }
            });
        });

        if (reassignments.length > 0) {
            setActivityLog([...reassignments, ...activityLog]);
            alert(`Reassigned ${reassignments.length} task(s)`);
        } else {
            alert('No tasks need reassignment');
        }
    };

    const userTeams = teams.filter(t => t.userId === currentUser?.id);
    const userProjects = projects.filter(p => p.userId === currentUser?.id);
    const userTasks = tasks.filter(t => userProjects.some(p => p.id === t.projectId));

    const getTeamSummary = () => {
        const summary = [];
        userProjects.forEach(project => {
            const team = teams.find(t => t.id === project.teamId);
            if (team) {
                team.members.forEach(member => {
                    const currentTasks = tasks.filter(t => t.projectId === project.id && t.assignedTo === member.name).length;
                    summary.push({
                        projectName: project.name,
                        memberName: member.name,
                        currentTasks,
                        capacity: member.capacity,
                        overloaded: currentTasks > member.capacity
                    });
                });
            }
        });
        return summary;
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setEditingItem(item);

        if (item) {
            if (type === 'team') setTeamForm(item);
            if (type === 'project') setProjectForm(item);
            if (type === 'task') setTaskForm(item);
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setEditingItem(null);
        setTeamForm({ name: '', members: [{ name: '', role: '', capacity: 3 }] });
        setProjectForm({ name: '', description: '', teamId: '' });
        setTaskForm({ title: '', description: '', projectId: '', assignedTo: '', priority: 'Medium', status: 'Pending' });
        setWarningMessage('');
    };

    const filteredTasks = userTasks.filter(task => {
        if (filterProject !== 'all' && task.projectId !== filterProject) return false;
        if (filterMember !== 'all' && task.assignedTo !== filterMember) return false;
        return true;
    });

    const allMembers = [...new Set(userProjects.flatMap(p => {
        const team = teams.find(t => t.id === p.teamId);
        return team ? team.members.map(m => m.name) : [];
    }))];

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-purple-500 border-double">
                    <h1 className="text-3xl font-bold text-white text-center bg-blue-700 w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 mb-3">Smart Task Manager</h1>

                    {view === 'login' ? (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Login</h2>
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full p-3 border rounded mb-3"
                                value={loginForm.username}
                                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full p-3 border rounded mb-4"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            />
                            <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 mb-3">
                                Login
                            </button>
                            <p className="text-center text-gray-600">
                                Don't have an account?{' '}
                                <button onClick={() => setView('register')} className="text-blue-600 hover:underline">
                                    Register
                                </button>
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Register</h2>
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full p-3 border rounded mb-3"
                                value={registerForm.username}
                                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full p-3 border rounded mb-3"
                                value={registerForm.password}
                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                className="w-full p-3 border rounded mb-4"
                                value={registerForm.confirmPassword}
                                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                            />
                            <button onClick={handleRegister} className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 mb-3">
                                Register
                            </button>
                            <p className="text-center text-gray-600">
                                Already have an account?{' '}
                                <button onClick={() => setView('login')} className="text-blue-600 hover:underline">
                                    Login
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white my-2">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center bg-blue-700 w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 mb-3">
                    <h1 className="text-2xl font-bold ">Smart Task Manager</h1>
                    <div className="flex items-center gap-4">
                        <span className="">Welcome, {currentUser.username}</span>
                        <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700">
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <nav className="bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-6">
                        {['dashboard', 'teams', 'projects', 'tasks'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setView(tab)}
                                className={`py-3 px-4 border-b-2 font-medium ${view === tab
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {view === 'dashboard' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
                            <div className="bg-white p-6 rounded-lg shadow  border border-purple-500 border-double">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm">Total Projects</p>
                                        <p className="text-3xl font-bold text-gray-800">{userProjects.length}</p>
                                    </div>
                                    <Briefcase className="text-blue-600" size={40} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow  border border-purple-500 border-double">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm">Total Tasks</p>
                                        <p className="text-3xl font-bold text-gray-800">{userTasks.length}</p>
                                    </div>
                                    <CheckSquare className="text-green-600" size={40} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow  border border-purple-500 border-double">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm">Total Teams</p>
                                        <p className="text-3xl font-bold text-gray-800">{userTeams.length}</p>
                                    </div>
                                    <Users className="text-purple-600" size={40} />
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <button
                                onClick={handleReassignTasks}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                Reassign Tasks
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow mb-8  border border-purple-500 border-double">
                            <div className="p-6 ">
                                <h2 className="text-xl font-semibold text-gray-800">Team Summary</h2>
                            </div>
                            <div className="p-6">
                                {getTeamSummary().length > 0 ? (
                                    <div className="space-y-4">
                                        {getTeamSummary().map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-lg border ${item.overloaded ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{item.memberName}</p>
                                                        <p className="text-sm text-gray-600">{item.projectName}</p>
                                                    </div>
                                                    <div className={`text-right ${item.overloaded ? 'text-red-600' : 'text-gray-600'}`}>
                                                        <p className="text-lg font-semibold">
                                                            {item.currentTasks} / {item.capacity}
                                                        </p>
                                                        <p className="text-sm">tasks</p>
                                                    </div>
                                                </div>
                                                {item.overloaded && (
                                                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                                                        <AlertCircle size={16} />
                                                        <span>Overloaded</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600">No team members yet</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow  border border-purple-500 border-double">
                            <div className="p-6 ">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <Activity size={24} />
                                    Recent Activity
                                </h2>
                            </div>
                            <div className="p-6">
                                {activityLog.length > 0 ? (
                                    <div className="space-y-3">
                                        {activityLog.slice(0, 5).map(log => (
                                            <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                                                <span className="text-sm text-gray-500 min-w-20">{log.time}</span>
                                                <span className="text-sm text-gray-700">{log.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600">No activity yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'teams' && (
                    <div className=''>
                        <div className="flex justify-between items-center mb-6 ">
                            <h2 className="text-2xl font-bold text-gray-800">Teams</h2>
                            <button
                                onClick={() => openModal('team')}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={20} />
                                Create Team
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                            {userTeams.map(team => (
                                <div key={team.id} className="bg-white rounded-lg shadow p-6  border border-purple-500 border-double">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800">{team.name}</h3>
                                        <button
                                            onClick={() => openModal('team', team)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-2 ">
                                        {team.members.map((member, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded  border border-purple-500 border-double">
                                                <div>
                                                    <p className="font-medium text-gray-800">{member.name}</p>
                                                    <p className="text-sm text-gray-600">{member.role}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Capacity</p>
                                                    <p className="font-semibold text-gray-800">{member.capacity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'projects' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                            <button
                                onClick={() => openModal('project')}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={20} />
                                Create Project
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {userProjects.map(project => {
                                const team = teams.find(t => t.id === project.teamId);
                                const projectTasks = tasks.filter(t => t.projectId === project.id);

                                return (
                                    <div key={project.id} className="bg-white rounded-lg shadow p-6  border border-purple-500 border-double">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800">{project.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                                            </div>
                                            <button
                                                onClick={() => openModal('project', project)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users size={16} />
                                                <span>Team: {team?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckSquare size={16} />
                                                <span>{projectTasks.length} tasks</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {view === 'tasks' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
                            <button
                                onClick={() => openModal('task')}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={20} />
                                Create Task
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Project</label>
                                <select
                                    value={filterProject}
                                    onChange={(e) => setFilterProject(e.target.value)}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="all">All Projects</option>
                                    {userProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Member</label>
                                <select
                                    value={filterMember}
                                    onChange={(e) => setFilterMember(e.target.value)}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="all">All Members</option>
                                    {allMembers.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredTasks.map(task => {
                                const project = projects.find(p => p.id === task.projectId);
                                const priorityColors = {
                                    Low: 'bg-green-100 text-green-800',
                                    Medium: 'bg-yellow-100 text-yellow-800',
                                    High: 'bg-red-100 text-red-800'
                                };
                                const statusColors = {
                                    Pending: 'bg-gray-100 text-gray-800',
                                    'In Progress': 'bg-blue-100 text-blue-800',
                                    Done: 'bg-green-100 text-green-800'
                                };

                                return (
                                    <div key={task.id} className="bg-white rounded-lg shadow p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditTask(task)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>Project: {project?.name || 'N/A'}</p>
                                            <p>Assigned to: {task.assignedTo || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {editingItem ? 'Edit' : 'Create'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="p-6">
                            {modalType === 'team' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                                        <input
                                            type="text"
                                            value={teamForm.name}
                                            onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                            className="w-full p-3 border rounded"
                                            placeholder="Enter team name"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                                        {teamForm.members.map((member, idx) => (
                                            <div key={idx} className="flex gap-2 mb-3">
                                                <input
                                                    type="text"
                                                    value={member.name}
                                                    onChange={(e) => handleTeamMemberChange(idx, 'name', e.target.value)}
                                                    className="flex-1 p-2 border rounded"
                                                    placeholder="Name"
                                                />
                                                <input
                                                    type="text"
                                                    value={member.role}
                                                    onChange={(e) => handleTeamMemberChange(idx, 'role', e.target.value)}
                                                    className="flex-1 p-2 border rounded"
                                                    placeholder="Role"
                                                />
                                                <input
                                                    type="number"
                                                    value={member.capacity}
                                                    onChange={(e) => handleTeamMemberChange(idx, 'capacity', e.target.value)}
                                                    className="w-24 p-2 border rounded"
                                                    placeholder="Capacity"
                                                    min="0"
                                                    max="10"
                                                />
                                                {teamForm.members.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveTeamMember(idx)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={handleAddTeamMember}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            <Plus size={16} />
                                            Add Member
                                        </button>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 border rounded hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveTeam}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Save Team
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modalType === 'project' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                        <input
                                            type="text"
                                            value={projectForm.name}
                                            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                            className="w-full p-3 border rounded"
                                            placeholder="Enter project name"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={projectForm.description}
                                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                            className="w-full p-3 border rounded"
                                            rows="3"
                                            placeholder="Enter project description"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
                                        <select
                                            value={projectForm.teamId}
                                            onChange={(e) => setProjectForm({ ...projectForm, teamId: e.target.value })}
                                            className="w-full p-3 border rounded"
                                        >
                                            <option value="">Select a team</option>
                                            {userTeams.map(team => (
                                                <option key={team.id} value={team.id}>{team.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 border rounded hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveProject}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Save Project
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modalType === 'task' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                                        <input
                                            type="text"
                                            value={taskForm.title}
                                            onChange={(e) => handleTaskFormChange('title', e.target.value)}
                                            className="w-full p-3 border rounded"
                                            placeholder="Enter task title"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={taskForm.description}
                                            onChange={(e) => handleTaskFormChange('description', e.target.value)}
                                            className="w-full p-3 border rounded"
                                            rows="3"
                                            placeholder="Enter task description"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                                        <select
                                            value={taskForm.projectId}
                                            onChange={(e) => handleTaskFormChange('projectId', e.target.value)}
                                            className="w-full p-3 border rounded"
                                        >
                                            <option value="">Select a project</option>
                                            {userProjects.map(project => (
                                                <option key={project.id} value={project.id}>{project.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {taskForm.projectId && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                                            <select
                                                value={taskForm.assignedTo}
                                                onChange={(e) => handleTaskFormChange('assignedTo', e.target.value)}
                                                className="w-full p-3 border rounded"
                                            >
                                                <option value="">Select a member</option>
                                                {teams.find(t => t.id === projects.find(p => p.id === taskForm.projectId)?.teamId)?.members.map(member => {
                                                    const currentTasks = getMemberTaskCount(member.name, taskForm.projectId);
                                                    return (
                                                        <option key={member.name} value={member.name}>
                                                            {member.name} ({currentTasks} / {member.capacity})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <button
                                                onClick={handleAutoAssign}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                Auto-assign to least loaded member
                                            </button>
                                        </div>
                                    )}

                                    {warningMessage && (
                                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                                            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                                            <div className="flex-1">
                                                <p className="text-sm text-yellow-800">{warningMessage}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => setWarningMessage('')}
                                                        className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                                                    >
                                                        Assign Anyway
                                                    </button>
                                                    <button
                                                        onClick={() => handleTaskFormChange('assignedTo', '')}
                                                        className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                                                    >
                                                        Choose Another
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                        <select
                                            value={taskForm.priority}
                                            onChange={(e) => handleTaskFormChange('priority', e.target.value)}
                                            className="w-full p-3 border rounded"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={taskForm.status}
                                            onChange={(e) => handleTaskFormChange('status', e.target.value)}
                                            className="w-full p-3 border rounded"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 border rounded hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveTask}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Save Task
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskManager;