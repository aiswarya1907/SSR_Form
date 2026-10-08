// ========================================
// CLIENT-SIDE ROUTING
// ========================================

function goToForm() {
    window.location.href = "/form";
}

function goHome() {
    window.location.href = "/";
}


// ========================================
// VARIABLES
// ========================================

let skills = [];


// ========================================
// GET FORM
// ========================================

const form = document.getElementById("registrationForm");


// ========================================
// FORM VALIDATION
// ========================================

if (form) {

    form.addEventListener("submit", function (event) {

        let isValid = true;


        // Get values

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // Get error elements

        const nameError =
            document.getElementById("nameError");

        const emailError =
            document.getElementById("emailError");

        const phoneError =
            document.getElementById("phoneError");

        const passwordError =
            document.getElementById("passwordError");

        const confirmPasswordError =
            document.getElementById("confirmPasswordError");


        // Clear old errors

        nameError.textContent = "";
        emailError.textContent = "";
        phoneError.textContent = "";
        passwordError.textContent = "";
        confirmPasswordError.textContent = "";


        // ========================================
        // NAME VALIDATION
        // ========================================

        if (name.length < 3) {

            nameError.textContent =
                "Name must contain at least 3 characters.";

            isValid = false;
        }


        // ========================================
        // EMAIL VALIDATION
        // ========================================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            emailError.textContent =
                "Please enter a valid email address.";

            isValid = false;
        }


        // ========================================
        // PHONE VALIDATION
        // ========================================

        const phonePattern =
            /^[0-9]{10}$/;

        if (!phonePattern.test(phone)) {

            phoneError.textContent =
                "Phone number must contain exactly 10 digits.";

            isValid = false;
        }


        // ========================================
        // PASSWORD VALIDATION
        // ========================================

        if (password.length < 8) {

            passwordError.textContent =
                "Password must contain at least 8 characters.";

            isValid = false;
        }

        if (!/[A-Z]/.test(password)) {

            passwordError.textContent =
                "Password must contain at least one uppercase letter.";

            isValid = false;
        }

        if (!/[0-9]/.test(password)) {

            passwordError.textContent =
                "Password must contain at least one number.";

            isValid = false;
        }

        if (!/[^A-Za-z0-9]/.test(password)) {

            passwordError.textContent =
                "Password must contain at least one special character.";

            isValid = false;
        }


        // ========================================
        // CONFIRM PASSWORD
        // ========================================

        if (password !== confirmPassword) {

            confirmPasswordError.textContent =
                "Passwords do not match.";

            isValid = false;
        }


        // ========================================
        // PREVENT SUBMISSION
        // ========================================

        if (!isValid) {

            event.preventDefault();

        }

    });

}


// ========================================
// PASSWORD STRENGTH INDICATOR
// ========================================

const passwordInput =
    document.getElementById("password");

if (passwordInput) {

    passwordInput.addEventListener("input", function () {

        const password = this.value;

        const strengthBar =
            document.getElementById("strengthBar");

        const strengthText =
            document.getElementById("passwordStrength");

        let strength = 0;


        // Check password conditions

        if (password.length >= 8) {
            strength++;
        }

        if (/[A-Z]/.test(password)) {
            strength++;
        }

        if (/[0-9]/.test(password)) {
            strength++;
        }

        if (/[^A-Za-z0-9]/.test(password)) {
            strength++;
        }


        // Update the DOM

        if (strength === 0) {

            strengthBar.style.width = "0%";
            strengthText.textContent = "";

        }

        else if (strength === 1) {

            strengthBar.style.width = "25%";
            strengthText.textContent =
                "Weak Password";

        }

        else if (strength === 2) {

            strengthBar.style.width = "50%";
            strengthText.textContent =
                "Medium Password";

        }

        else if (strength === 3) {

            strengthBar.style.width = "75%";
            strengthText.textContent =
                "Good Password";

        }

        else {

            strengthBar.style.width = "100%";
            strengthText.textContent =
                "Strong Password";

        }

    });

}


// ========================================
// DYNAMIC SKILL ADDITION
// ========================================

function addSkill() {

    const skillInput =
        document.getElementById("skillInput");

    const skill =
        skillInput.value.trim();


    // Check empty input

    if (skill === "") {

        alert("Please enter a skill.");

        return;
    }


    // Add skill to array

    skills.push(skill);


    // Clear input

    skillInput.value = "";


    // Update DOM

    updateSkills();

}


// ========================================
// UPDATE SKILLS IN DOM
// ========================================

function updateSkills() {

    const skillList =
        document.getElementById("skillList");

    const hiddenSkills =
        document.getElementById("skills");


    // Clear existing list

    skillList.innerHTML = "";


    // Create list elements dynamically

    skills.forEach(function (skill, index) {

        const listItem =
            document.createElement("li");

        listItem.textContent = skill;


        // Create remove button

        const removeButton =
            document.createElement("button");

        removeButton.textContent = "Remove";

        removeButton.type = "button";

        removeButton.className =
            "btn btn-sm btn-danger ms-2";


        // Remove skill

        removeButton.addEventListener(
            "click",
            function () {

                skills.splice(index, 1);

                updateSkills();

            }
        );


        // Add button to list item

        listItem.appendChild(removeButton);


        // Add list item to page

        skillList.appendChild(listItem);

    });


    // Store skills for server

    hiddenSkills.value =
        skills.join(", ");

}


// ========================================
// CHARACTER COUNTER
// ========================================

const aboutInput =
    document.getElementById("about");

if (aboutInput) {

    aboutInput.addEventListener("input", function () {

        const characterCount =
            document.getElementById("charCount");

        characterCount.textContent =
            this.value.length;

    });

}