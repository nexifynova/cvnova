  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
        router.refresh(); 
      } else {
        alert(`Error: ${data.error}`); // Ab asli error dikhega
        setLoading(false);
      }
    } catch (err: any) {
      alert("Network Error: " + err.message);
      setLoading(false);
    }
  };