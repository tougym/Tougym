import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOLD = "#D6B56D";
const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
type Session = { id:string; day:string; time:string; shift:"Mañana"|"Tarde"; activity:string; capacity:number };
type Booking = { id:string; sessionId:string; name:string; phone:string; status:"Reservada"|"Espera"; createdAt:string };
type Customer = { id:string; name:string; phone:string; plan:string; remaining:number; active:boolean };
const initialSessions: Session[] = DAYS.flatMap((day, i) => {
  const activities = ["Fuerza total","Cardio","Glúteos y piernas","Piernas","Sorpresa"];
  return ["08:00","09:00","10:00"].map((time,j)=>({
    id:`${i}-m-${j}`,day,time,shift:"Mañana" as const,activity:activities[i],capacity:10
  }));
});
const seed = { sessions: initialSessions, bookings: [] as Booking[], customers: [] as Customer[] };

export default function App() {
  const [tab,setTab] = useState<"Reservar"|"Mis reservas"|"Admin">("Reservar");
  const [day,setDay] = useState("Lunes");
  const [shift,setShift] = useState<"Mañana"|"Tarde">("Mañana");
  const [data,setData] = useState(seed);
  const [loaded,setLoaded] = useState(false);
  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [admin,setAdmin] = useState(false);
  const [pin,setPin] = useState("");
  const [newTime,setNewTime] = useState("17:00");
  const [newActivity,setNewActivity] = useState("Fuerza total");
  const [newCapacity,setNewCapacity] = useState("10");
  const [newDay,setNewDay] = useState("Lunes");
  const [customerName,setCustomerName] = useState("");
  const [customerPhone,setCustomerPhone] = useState("");
  const [customerPlan,setCustomerPlan] = useState("Bono 10 sesiones");
  const [filter,setFilter] = useState("");

  useEffect(()=>{ (async()=>{
    try { const raw=await AsyncStorage.getItem("tougym_mvp"); if(raw) setData(JSON.parse(raw)); }
    catch(e) { console.warn(e); } finally { setLoaded(true); }
  })(); },[]);
  useEffect(()=>{ if(loaded) AsyncStorage.setItem("tougym_mvp",JSON.stringify(data)).catch(console.warn); },[data,loaded]);

  const visibleSessions = useMemo(()=>data.sessions.filter(s=>s.day===day && s.shift===shift).sort((a,b)=>a.time.localeCompare(b.time)),[data.sessions,day,shift]);
  const mine = data.bookings.filter(b=>b.phone===phone && b.status==="Reservada");
  const waiting = data.bookings.filter(b=>b.phone===phone && b.status==="Espera");

  function book(s:Session) {
    if(!name.trim() || phone.trim().length<9) return Alert.alert("Completa tus datos","Introduce nombre y teléfono para reservar.");
    const current = data.bookings.filter(b=>b.sessionId===s.id && b.status==="Reservada").length;
    const already = data.bookings.some(b=>b.sessionId===s.id && b.phone===phone && b.status!=="Espera");
    if(already) return Alert.alert("Ya tienes plaza","Ya existe una reserva para esta sesión.");
    const status = current < s.capacity ? "Reservada" : "Espera";
    setData(d=>({...d,bookings:[...d.bookings,{id:Date.now().toString(),sessionId:s.id,name:name.trim(),phone:phone.trim(),status,createdAt:new Date().toISOString()}]}));
    Alert.alert(status==="Reservada"?"Plaza reservada":"Lista de espera",status==="Reservada"?"Tu plaza queda guardada en este dispositivo.":"La clase está completa; te hemos añadido a la lista de espera.");
  }
  function cancel(b:Booking) {
    const s=data.sessions.find(x=>x.id===b.sessionId);
    if(s) {
      const [h,m]=s.time.split(":").map(Number);
      const target=new Date(); target.setHours(h,m,0,0);
      const delta=target.getTime()-Date.now();
      if(delta < 3*60*60*1000) return Alert.alert("Plazo de cancelación cerrado","La cancelación debe hacerse al menos 3 horas antes de la clase.");
    }
    setData(d=>{
      const updated=d.bookings.filter(x=>x.id!==b.id);
      const next=updated.filter(x=>x.sessionId===b.sessionId && x.status==="Espera").sort((a,b)=>a.createdAt.localeCompare(b.createdAt))[0];
      if(next) next.status="Reservada";
      return {...d,bookings:updated};
    });
  }
  function addAfternoon() {
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(newTime) || Number(newCapacity)<1) return Alert.alert("Revisa los datos","Introduce una hora válida y aforo mayor que cero.");
    const id=`aft-${Date.now()}`;
    setData(d=>({...d,sessions:[...d.sessions,{id,day:newDay,time:newTime,shift:"Tarde",activity:newActivity,capacity:Number(newCapacity)}]}));
    Alert.alert("Horario añadido","La sesión de tarde se ha añadido a este dispositivo.");
  }
  function addCustomer() {
    if(!customerName.trim() || customerPhone.trim().length<9) return Alert.alert("Faltan datos","Introduce nombre y teléfono.");
    const n=customerPlan.includes("5")?5:customerPlan.includes("20")?20:customerPlan.includes("Mensualidad")?0:10;
    setData(d=>({...d,customers:[...d.customers,{id:Date.now().toString(),name:customerName.trim(),phone:customerPhone.trim(),plan:customerPlan,remaining:n,active:true}]}));
    setCustomerName(""); setCustomerPhone("");
  }
  function spend(c:Customer) {
    if(c.remaining<=0) return Alert.alert("Sin sesiones","Este bono no tiene sesiones disponibles.");
    setData(d=>({...d,customers:d.customers.map(x=>x.id===c.id?{...x,remaining:x.remaining-1}:x)}));
  }

  const Button=({label,onPress,outline=false,disabled=false}:{label:string,onPress:()=>void,outline?:boolean,disabled?:boolean})=>(
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button,outline&&styles.buttonOutline,disabled&&{opacity:.4}]}>
      <Text style={[styles.buttonText,outline&&{color:GOLD}]}>{label}</Text>
    </TouchableOpacity>
  );
  const Field=({value,onChangeText,placeholder,keyboardType="default"}:any)=>(
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#888" keyboardType={keyboardType} style={styles.input}/>
  );

  if(!loaded) return <SafeAreaView style={styles.safe}><Text style={styles.muted}>Cargando TOUGYM…</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content"/>
    <View style={styles.header}>
      <View><Text style={styles.logo}>TOUGYM</Text><Text style={styles.tagline}>YOUR TRAINING. YOUR RULES.</Text></View>
      <Text style={styles.gold}>◆</Text>
    </View>
    <View style={styles.nav}>
      {(["Reservar","Mis reservas","Admin"] as const).map(t=><TouchableOpacity key={t} onPress={()=>setTab(t)} style={[styles.navItem,tab===t&&styles.navActive]}><Text style={[styles.navText,tab===t&&{color:GOLD}]}>{t}</Text></TouchableOpacity>)}
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab==="Reservar" && <>
        <Text style={styles.kicker}>BIENVENIDO/A</Text><Text style={styles.title}>Reserva tu entrenamiento</Text>
        <Field value={name} onChangeText={setName} placeholder="Nombre y apellidos"/>
        <Field value={phone} onChangeText={setPhone} placeholder="Teléfono móvil" keyboardType="phone-pad"/>
        <View style={styles.segment}>{(["Mañana","Tarde"] as const).map(x=><TouchableOpacity key={x} onPress={()=>setShift(x)} style={[styles.segmentItem,shift===x&&styles.segmentSelected]}><Text style={[styles.segmentText,shift===x&&{color:"#111"}]}>{x}</Text></TouchableOpacity>)}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight:48,marginVertical:14}}>{DAYS.map(x=><TouchableOpacity key={x} onPress={()=>setDay(x)} style={[styles.day,day===x&&styles.daySelected]}><Text style={{color:day===x?GOLD:"#DDD",fontWeight:"700"}}>{x.slice(0,3)}</Text></TouchableOpacity>)}</ScrollView>
        {visibleSessions.length===0?<View style={styles.card}><Text style={styles.cardTitle}>Horario pendiente</Text><Text style={styles.muted}>Todavía no hay clases configuradas para este turno. La administradora podrá añadirlas desde Admin.</Text></View>:visibleSessions.map(s=>{
          const count=data.bookings.filter(b=>b.sessionId===s.id&&b.status==="Reservada").length;
          const status=data.bookings.find(b=>b.sessionId===s.id&&b.phone===phone);
          return <View style={styles.card} key={s.id}>
            <View style={styles.rowBetween}><Text style={styles.time}>{s.time}</Text><Text style={styles.pill}>{Math.max(0,s.capacity-count)} plazas libres</Text></View>
            <Text style={styles.cardTitle}>{s.activity}</Text><Text style={styles.muted}>{s.day} · {s.shift} · Aforo {s.capacity}</Text>
            <Button label={status?(status.status==="Espera"?"En lista de espera":"Ya reservada"):count>=s.capacity?"Apuntarme a espera":"Reservar plaza"} onPress={()=>book(s)} outline={count>=s.capacity||!!status}/>
          </View>
        })}
      </>}
      {tab==="Mis reservas" && <>
        <Text style={styles.kicker}>ÁREA PERSONAL</Text><Text style={styles.title}>Mis reservas</Text>
        <Field value={phone} onChangeText={setPhone} placeholder="Introduce tu teléfono" keyboardType="phone-pad"/>
        {mine.length+waiting.length===0?<Text style={styles.muted}>No aparecen reservas para este teléfono en este dispositivo.</Text>:[...mine,...waiting].map(b=>{
          const s=data.sessions.find(x=>x.id===b.sessionId);
          return <View style={styles.card} key={b.id}><Text style={styles.cardTitle}>{s?.activity||"Clase"}</Text><Text style={styles.muted}>{s?.day} · {s?.time} · {b.status}</Text>{b.status==="Reservada"&&<Button label="Cancelar reserva" outline onPress={()=>cancel(b)}/>}</View>
        })}
        <Text style={styles.section}>Mis bonos</Text>
        {data.customers.filter(c=>c.phone===phone).map(c=><View style={styles.card} key={c.id}><Text style={styles.cardTitle}>{c.plan}</Text><Text style={styles.muted}>{c.plan.includes("Bono")?`${c.remaining} sesiones disponibles`:"Mensualidad registrada"}</Text></View>)}
      </>}
      {tab==="Admin" && <>
        {!admin?<View style={styles.card}><Text style={styles.kicker}>ACCESO PRIVADO · DEMOSTRACIÓN</Text><Text style={styles.title}>TOUGYM Admin</Text><Text style={styles.muted}>Introduce el PIN de demostración para abrir las herramientas locales. En producción se sustituirá por acceso seguro de administradora.</Text><Field value={pin} onChangeText={setPin} placeholder="PIN de prueba" keyboardType="number-pad"/><Button label="Entrar" onPress={()=>pin==="2468"?(setAdmin(true),setPin("")):Alert.alert("PIN incorrecto","Para esta demo, el PIN es 2468.")}/></View>:<>
          <Text style={styles.kicker}>PANEL DE CONTROL</Text><Text style={styles.title}>Administración</Text>
          <View style={styles.stats}><View style={styles.stat}><Text style={styles.statNum}>{data.bookings.filter(b=>b.status==="Reservada").length}</Text><Text style={styles.muted}>Reservas activas</Text></View><View style={styles.stat}><Text style={styles.statNum}>{data.customers.length}</Text><Text style={styles.muted}>Clientes</Text></View><View style={styles.stat}><Text style={styles.statNum}>{data.bookings.filter(b=>b.status==="Espera").length}</Text><Text style={styles.muted}>En espera</Text></View></View>
          <Text style={styles.section}>Horario de tarde</Text><Text style={styles.muted}>Añade sesiones de tarde para cualquier día. El horario de mañana ya está creado a las 08:00, 09:00 y 10:00.</Text>
          <Text style={styles.label}>Día</Text><View style={styles.wrap}>{DAYS.map(x=><TouchableOpacity key={x} onPress={()=>setNewDay(x)} style={[styles.day,newDay===x&&styles.daySelected]}><Text style={{color:newDay===x?GOLD:"#DDD"}}>{x.slice(0,3)}</Text></TouchableOpacity>)}</View>
          <Text style={styles.label}>Hora (24 h)</Text><Field value={newTime} onChangeText={setNewTime} placeholder="17:00"/>
          <Text style={styles.label}>Actividad</Text><View style={styles.wrap}>{["Fuerza total","Cardio","Glúteos y piernas","Piernas","Sorpresa"].map(x=><TouchableOpacity key={x} onPress={()=>setNewActivity(x)} style={[styles.day,newActivity===x&&styles.daySelected]}><Text style={{color:newActivity===x?GOLD:"#DDD"}}>{x}</Text></TouchableOpacity>)}</View>
          <Text style={styles.label}>Aforo</Text><Field value={newCapacity} onChangeText={setNewCapacity} placeholder="10" keyboardType="number-pad"/>
          <Button label="Añadir clase de tarde" onPress={addAfternoon}/>
          <Text style={styles.section}>Clases programadas</Text>
          {data.sessions.slice().sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||a.time.localeCompare(b.time)).map(s=><View style={styles.listRow} key={s.id}><View style={{flex:1}}><Text style={styles.cardTitle}>{s.day} · {s.time}</Text><Text style={styles.muted}>{s.activity} · {s.shift} · Aforo {s.capacity}</Text></View><TouchableOpacity onPress={()=>setData(d=>({...d,sessions:d.sessions.filter(x=>x.id!==s.id),bookings:d.bookings.filter(b=>b.sessionId!==s.id)}))}><Text style={{color:"#E28C80"}}>Eliminar</Text></TouchableOpacity></View>)}
          <Text style={styles.section}>Clientes y bonos</Text>
          <Field value={customerName} onChangeText={setCustomerName} placeholder="Nombre del cliente"/>
          <Field value={customerPhone} onChangeText={setCustomerPhone} placeholder="Teléfono" keyboardType="phone-pad"/>
          <View style={styles.wrap}>{["Bono 5 sesiones","Bono 10 sesiones","Bono 20 sesiones","Mensualidad"].map(x=><TouchableOpacity key={x} onPress={()=>setCustomerPlan(x)} style={[styles.day,customerPlan===x&&styles.daySelected]}><Text style={{color:customerPlan===x?GOLD:"#DDD"}}>{x}</Text></TouchableOpacity>)}</View>
          <Button label="Añadir cliente" onPress={addCustomer}/>
          <Field value={filter} onChangeText={setFilter} placeholder="Filtrar clientes"/>
          {data.customers.filter(c=>(c.name+c.phone).toLowerCase().includes(filter.toLowerCase())).map(c=><View style={styles.listRow} key={c.id}><View style={{flex:1}}><Text style={styles.cardTitle}>{c.name}</Text><Text style={styles.muted}>{c.phone} · {c.plan} · {c.plan.includes("Bono")?`${c.remaining} sesiones`:"Activo"}</Text></View>{c.plan.includes("Bono")&&<TouchableOpacity onPress={()=>spend(c)}><Text style={{color:GOLD,fontWeight:"800"}}>−1 sesión</Text></TouchableOpacity>}</View>)}
          <Button label="Cerrar panel" outline onPress={()=>setAdmin(false)}/>
        </>}
      </>}
      <Text style={styles.disclaimer}>Versión MVP local: los datos se guardan en este dispositivo. No compartir todavía con clientes ni utilizar para reservas reales. Para producción se conectará una base de datos segura y cuentas individuales.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#101010"},header:{paddingHorizontal:20,paddingTop:14,paddingBottom:16,flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#514225"},
 logo:{fontSize:31,fontWeight:"900",letterSpacing:3,color:GOLD},tagline:{fontSize:9,letterSpacing:2,color:"#AAA",marginTop:3},gold:{color:GOLD,fontSize:24},
 nav:{flexDirection:"row",padding:8,backgroundColor:"#191919"},navItem:{flex:1,padding:11,alignItems:"center",borderRadius:8},navActive:{backgroundColor:"#332B1D"},navText:{color:"#BBB",fontWeight:"700",fontSize:12},
 content:{padding:18,paddingBottom:45},kicker:{color:GOLD,fontSize:10,fontWeight:"900",letterSpacing:1.5,marginTop:8},title:{color:"#FFF",fontSize:25,fontWeight:"900",marginTop:6,marginBottom:15},
 input:{backgroundColor:"#222",borderColor:"#393939",borderWidth:1,borderRadius:10,color:"#FFF",padding:13,marginBottom:10},
 segment:{flexDirection:"row",backgroundColor:"#222",padding:4,borderRadius:10,marginTop:8},segmentItem:{flex:1,padding:12,alignItems:"center",borderRadius:8},segmentSelected:{backgroundColor:GOLD},segmentText:{color:"#EEE",fontWeight:"800"},
 day:{backgroundColor:"#242424",paddingHorizontal:13,paddingVertical:10,borderRadius:9,marginRight:7,marginBottom:7},daySelected:{borderWidth:1,borderColor:GOLD,backgroundColor:"#30291D"},
 card:{backgroundColor:"#1B1B1B",borderColor:"#38332A",borderWidth:1,borderRadius:14,padding:15,marginBottom:12},rowBetween:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},time:{fontSize:22,fontWeight:"900",color:GOLD},pill:{color:GOLD,fontSize:11,backgroundColor:"#332B1D",padding:7,borderRadius:20},cardTitle:{color:"#FFF",fontWeight:"900",fontSize:16,marginTop:5},muted:{color:"#AAA",fontSize:12,lineHeight:18,marginTop:4},
 button:{backgroundColor:GOLD,padding:13,borderRadius:9,alignItems:"center",marginTop:12},buttonOutline:{backgroundColor:"transparent",borderWidth:1,borderColor:GOLD},buttonText:{color:"#111",fontWeight:"900"},
 section:{color:GOLD,fontWeight:"900",fontSize:18,marginTop:24,marginBottom:10},label:{color:"#DDD",fontSize:12,fontWeight:"800",marginTop:8,marginBottom:6},wrap:{flexDirection:"row",flexWrap:"wrap"},
 stats:{flexDirection:"row",gap:8,marginVertical:10},stat:{flex:1,backgroundColor:"#242424",padding:12,borderRadius:10},statNum:{color:GOLD,fontSize:23,fontWeight:"900"},
 listRow:{flexDirection:"row",alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#333"},disclaimer:{color:"#777",fontSize:10,lineHeight:15,marginTop:25}
});
