# Smart Task Manager

A simple web app to manage projects, teams and tasks --- assign tasks to
team members, track capacity, and automatically rebalance workload with
a **Reassign Tasks** button.

## Features

1.  **User & Team Setup**

    -   Users can register and log in.
    -   Users can create teams and add members manually (no email
        required).
    -   Each team member has:
        -   Name
        -   Role
        -   Capacity (0--5 tasks they can handle comfortably)

2.  **Project & Task Management**

    -   Create projects and link them to a specific team.
    -   Add tasks under a project.
    -   Each task includes:
        -   Title
        -   Description
        -   Assigned Member (or "Unassigned")
        -   Priority: Low / Medium / High
        -   Status: Pending / In Progress / Done
    -   Add, Edit, Delete tasks.
    -   Filter tasks by Project or Member.

3.  **Task Assignment Flow**

    -   While creating a task:
        -   Select Project (team auto-links).

        -   Choose Assigned Member from the dropdown.

        -   Show each member's (currentTasks / capacity).

        -   If a member is over capacity, show warning:

                Riya has 4 tasks but capacity is 3. Assign anyway?

        -   Options: **Assign Anyway** / **Choose Another**

        -   Optional **Auto-assign** to pick lowest workload member.

4.  **Auto Reassignment**

    -   When user clicks **Reassign Tasks**:
        -   Detect overloaded members.
        -   Move extra tasks to members with free capacity.
    -   Rules:
        -   Keep High priority tasks with current assignee.
        -   Move only Low and Medium priority tasks.
        -   Update assignments automatically.
        -   Log changes in Activity Log.

5.  **Dashboard** Shows:

    -   Total Projects\
    -   Total Tasks\
    -   Team Summary (current tasks vs. capacity)\
    -   "Reassign Tasks" button\
    -   Recent Reassignments (last 5 moved tasks)

6.  **Activity Log** Example:

        10:30 AM — Task “UI Design” reassigned from Riya to Farhan.

    Shows latest 5--10 logs on dashboard.
