async function createUser() {
  const name = document.getElementById("name").value;
  const role = document.getElementById("role").value;
  const email = document.getElementById("email").value;
  const response = await fetch("http://localhost:3000/user",{
    method: "POST",
    headers: {
        "Content-Type":"application/json"
    },
    body: JSON.stringify({name,role,email})
  });

  const data = await response.json();
  console.log(data);

}

async function getUsers() {
  const response = await fetch("http://localhost:3000/users");
  const users = await response.json();

  const list = document.getElementById("userList");
  list.innerHTML = "";

  users.forEach(user => {
    const li=document.createElement("li");
    li.textContent = `${user.name} - ${user.role} - ${user.email}`;
    list.appendChild(li);
  });
}