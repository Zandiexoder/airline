package controllers

import com.patson.Authentication
import com.patson.data.{AirlineSource, UserSource, SettingsSource}
import com.patson.model.{Airline, User, UserStatus}
import com.patson.util.AirlineCache
import play.api.libs.json.{JsArray, JsBoolean, JsNumber, JsObject, JsString, JsValue, Json, Writes}
import play.api.mvc._

import java.util.Calendar
import javax.inject.Inject

/**
 * Controller for desktop single-player mode
 * Handles auto-login and airline creation without authentication
 */
class DesktopApplication @Inject()(cc: ControllerComponents) extends AbstractController(cc) {
  
  implicit object UserWrites extends Writes[User] {
    def writes(user: User): JsValue = {
      JsObject(List(
        "id" -> JsNumber(user.id),
        "userName" -> JsString(user.userName),
        "email" -> JsString(user.email),
        "status" -> JsString(user.status.toString()),
        "level" -> JsNumber(user.level),
        "creationTime" -> JsString(user.creationTime.getTime.toString()),
        "lastActiveTime" -> JsString(user.lastActiveTime.getTime.toString()),
        "airlineIds" -> JsArray(user.getAccessibleAirlines().map { airline => JsNumber(airline.id) })))
    }
  }
  
  /**
   * Auto-login for desktop mode
   * Creates or retrieves the single-player user and airline
   * Returns user JSON directly (not a redirect) so frontend can use it
   */
  def autoLogin = Action { implicit request =>
    val desktopUsername = "desktop_player"
    val desktopEmail = "desktop@flightforge.local"
    
    println(s"=== AUTO-LOGIN REQUEST ===")
    println(s"Request body: ${request.body}")
    
    // Check if user already exists
    val existingUser = UserSource.loadUserByUserName(desktopUsername)
    println(s"Existing user found: ${existingUser.isDefined}")
    
    val user = existingUser.getOrElse {
      // Create new user
      val newUser = User(
        desktopUsername, 
        desktopEmail, 
        Calendar.getInstance, 
        Calendar.getInstance, 
        UserStatus.ACTIVE, 
        level = 0, 
        None, 
        List.empty
      )
      UserSource.saveUser(newUser)
      
      // Create a simple password (not used in desktop mode)
      Authentication.createUserSecret(desktopUsername, "desktop")
      
      newUser
    }
    
    // Check if user has an airline
    val airlineOption = user.getAccessibleAirlines().headOption
    println(s"User has airline: ${airlineOption.isDefined}")
    
    val airline = airlineOption.getOrElse {
      // Get airline name from request or use default
      val airlineName = request.body.asFormUrlEncoded
        .flatMap(_.get("airlineName").flatMap(_.headOption))
        .getOrElse("FlightForge Airlines")
      
      println(s"Creating new airline: $airlineName")
      
      // Create new airline
      val newAirline = Airline(airlineName)
      newAirline.setMinimumRenewalBalance(300000)
      newAirline.setAirlineCode(newAirline.getDefaultAirlineCode())
      AirlineSource.saveAirlines(List(newAirline))
      UserSource.setUserAirline(user, newAirline)
      AirlineSource.saveAirplaneRenewal(newAirline.id, 40)
      
      println(s"Created airline with ID: ${newAirline.id}")
      
      newAirline
    }
    
    // Reload user to get airline info populated
    val userWithAirline = UserSource.loadUserById(user.id).getOrElse(user)
    println(s"Reloaded user airlines: ${userWithAirline.getAccessibleAirlines().map(_.id)}")
    
    // Create session and return user JSON (like /login endpoint does)
    val session = Session(Map("userToken" -> SessionUtil.addUserId(userWithAirline.id)))
    
    val result = Json.toJson(userWithAirline).asInstanceOf[JsObject] + 
      ("hasWallpaper" -> JsBoolean(SettingsSource.hasWallpaper(userWithAirline.id))) +
      ("isDesktopMode" -> JsBoolean(true))
    
    Ok(result)
      .withSession(session)
      .withCookies(Cookie("sessionActive", "true", httpOnly = false))
  }
  
  /**
   * Get current desktop session
   * Returns the logged-in desktop_player user or auto-creates if needed
   */
  def getSession = Action { implicit request =>
    val desktopUsername = "desktop_player"
    val desktopEmail = "desktop@flightforge.local"
    
    // Try to get user from session first
    val sessionUserId = request.session.get("userToken").flatMap(SessionUtil.getUserId)
    val existingUser = sessionUserId.flatMap(UserSource.loadUserById)
      .orElse(UserSource.loadUserByUserName(desktopUsername))
    
    val user = existingUser.getOrElse {
      // No user found - auto-create
      val newUser = User(
        desktopUsername, 
        desktopEmail, 
        Calendar.getInstance, 
        Calendar.getInstance, 
        UserStatus.ACTIVE, 
        level = 0, 
        None, 
        List.empty
      )
      UserSource.saveUser(newUser)
      Authentication.createUserSecret(desktopUsername, "desktop")
      newUser
    }
    
    // Check if user has an airline - if not, create a default one
    if (user.getAccessibleAirlines().isEmpty) {
      println(s"User ${user.userName} has no airline, creating default airline")
      
      // Create default airline
      val defaultAirlineName = "FlightForge Airlines"
      val newAirline = Airline(defaultAirlineName)
      newAirline.setMinimumRenewalBalance(300000)
      newAirline.setAirlineCode(newAirline.getDefaultAirlineCode())
      AirlineSource.saveAirlines(List(newAirline))
      UserSource.setUserAirline(user, newAirline)
      AirlineSource.saveAirplaneRenewal(newAirline.id, 40)
      
      println(s"Created default airline with ID: ${newAirline.id}")
      
      // Reload user to get airline populated
      val userWithAirline = UserSource.loadUserById(user.id).getOrElse(user)
      println(s"Reloaded user, airlines: ${userWithAirline.getAccessibleAirlines().map(_.id)}")
      
      // Return full user with airline
      val session = Session(Map("userToken" -> SessionUtil.addUserId(userWithAirline.id)))
      val result = Json.toJson(userWithAirline).asInstanceOf[JsObject] + 
        ("hasWallpaper" -> JsBoolean(SettingsSource.hasWallpaper(userWithAirline.id))) +
        ("isDesktopMode" -> JsBoolean(true))
      
      Ok(result)
        .withSession(session)
        .withCookies(Cookie("sessionActive", "true", httpOnly = false))
    } else {
      // Return full user with airline
      val session = Session(Map("userToken" -> SessionUtil.addUserId(user.id)))
      val result = Json.toJson(user).asInstanceOf[JsObject] + 
        ("hasWallpaper" -> JsBoolean(SettingsSource.hasWallpaper(user.id))) +
        ("isDesktopMode" -> JsBoolean(true))
      
      Ok(result)
        .withSession(session)
        .withCookies(Cookie("sessionActive", "true", httpOnly = false))
    }
  }
  
  /**
   * Unused - kept for backwards compatibility but airline name is set during autoLogin
   */
  def setAirlineName = Action { implicit request =>
    BadRequest(JsObject(List("error" -> JsString("Use autoLogin endpoint instead"))))
  }
}
